using System.Text.RegularExpressions;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace TccSolidario.Api.Services;

/// <summary>
/// Regras de upload de fotos: até <see cref="MaxImagens"/> arquivos JPG, PNG ou WEBP de até
/// <see cref="TamanhoMaximoBytes"/> cada. O tipo é identificado pelo conteúdo do arquivo
/// (assinatura binária), nunca pela extensão ou Content-Type enviados pelo navegador,
/// e o arquivo é gravado com nome aleatório e a extensão do tipo detectado.
/// Com o Cloudinary configurado (seção "Cloudinary"), as fotos vão para lá; sem ele,
/// ficam em wwwroot/uploads.
/// </summary>
public partial class ImagemUploadService(IWebHostEnvironment env, Cloudinary? cloudinary = null)
{
    public const int MaxImagens = 6;
    public const long TamanhoMaximoBytes = 5 * 1024 * 1024;
    private const string PastaCloudinary = "tcc-solidario";

    public static async Task ValidarAsync(IReadOnlyList<IFormFile> imagens, long tamanhoMaximo = TamanhoMaximoBytes)
    {
        if (imagens.Count > MaxImagens)
            throw new InvalidOperationException($"Envie no máximo {MaxImagens} fotos por alimento.");
        foreach (var imagem in imagens)
        {
            if (imagem.Length == 0)
                throw new InvalidOperationException($"A foto \"{imagem.FileName}\" está vazia.");
            if (imagem.Length > tamanhoMaximo)
                throw new InvalidOperationException($"A foto \"{imagem.FileName}\" passa de {tamanhoMaximo / (1024 * 1024)} MB.");
            if (await DetectarExtensaoAsync(imagem) is null)
                throw new InvalidOperationException($"A foto \"{imagem.FileName}\" não é JPG, PNG ou WEBP.");
        }
    }

    public async Task<string> SalvarAsync(IFormFile imagem, string pasta)
    {
        var extensao = await DetectarExtensaoAsync(imagem)
            ?? throw new InvalidOperationException("Formato de imagem não suportado.");
        var nome = Guid.NewGuid().ToString();

        if (cloudinary is not null)
        {
            await using var stream = imagem.OpenReadStream();
            var resultado = await cloudinary.UploadAsync(new ImageUploadParams
            {
                File = new FileDescription($"{nome}{extensao}", stream),
                Folder = $"{PastaCloudinary}/{pasta}",
                PublicId = nome,
                Overwrite = false,
            });
            if (resultado.Error is not null || resultado.SecureUrl is null)
                throw new InvalidOperationException("Não foi possível enviar a foto. Tente novamente.");
            return resultado.SecureUrl.ToString();
        }

        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var diretorio = Path.Combine(webRoot, "uploads", pasta);
        Directory.CreateDirectory(diretorio);
        await using var destino = new FileStream(Path.Combine(diretorio, nome + extensao), FileMode.CreateNew);
        await imagem.CopyToAsync(destino);
        return $"/uploads/{pasta}/{nome}{extensao}";
    }

    public async Task RemoverAsync(IEnumerable<string> urls)
    {
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        foreach (var url in urls)
        {
            if (Uri.TryCreate(url, UriKind.Absolute, out _))
            {
                // Só apaga o que este app enviou ao Cloudinary; falhas aqui não devem derrubar a requisição.
                var publicId = PublicIdCloudinary(url);
                if (cloudinary is not null && publicId is not null)
                {
                    try { await cloudinary.DestroyAsync(new DeletionParams(publicId)); }
                    catch (Exception) { }
                }
                continue;
            }
            // Só apaga uploads; imagens fixas do projeto (ex.: /seed) ficam.
            var pastaUploads = Path.GetFullPath(Path.Combine(webRoot, "uploads")) + Path.DirectorySeparatorChar;
            var caminho = Path.GetFullPath(Path.Combine(webRoot, url.TrimStart('/')));
            if (caminho.StartsWith(pastaUploads) && File.Exists(caminho)) File.Delete(caminho);
        }
    }

    // https://res.cloudinary.com/<nuvem>/image/upload/v123/tcc-solidario/produtos/<guid>.jpg -> tcc-solidario/produtos/<guid>
    private static string? PublicIdCloudinary(string url)
    {
        var match = RegexPublicId().Match(url);
        return match.Success ? match.Groups["id"].Value : null;
    }

    [GeneratedRegex($@"/image/upload/(?:v\d+/)?(?<id>{PastaCloudinary}/[\w-]+/[\w-]+)\.\w+$")]
    private static partial Regex RegexPublicId();

    private static async Task<string?> DetectarExtensaoAsync(IFormFile imagem)
    {
        var cabecalho = new byte[12];
        await using var stream = imagem.OpenReadStream();
        var lidos = await stream.ReadAtLeastAsync(cabecalho, cabecalho.Length, throwOnEndOfStream: false);
        if (lidos >= 3 && cabecalho[0] == 0xFF && cabecalho[1] == 0xD8 && cabecalho[2] == 0xFF) return ".jpg";
        if (lidos >= 8 && cabecalho.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A })) return ".png";
        if (lidos >= 12 && cabecalho.AsSpan(0, 4).SequenceEqual("RIFF"u8) && cabecalho.AsSpan(8, 4).SequenceEqual("WEBP"u8)) return ".webp";
        return null;
    }
}
