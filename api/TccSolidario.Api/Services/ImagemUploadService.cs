namespace TccSolidario.Api.Services;

/// <summary>
/// Regras de upload de fotos: até <see cref="MaxImagens"/> arquivos JPG, PNG ou WEBP de até
/// <see cref="TamanhoMaximoBytes"/> cada. O tipo é identificado pelo conteúdo do arquivo
/// (assinatura binária), nunca pela extensão ou Content-Type enviados pelo navegador,
/// e o arquivo é gravado com nome aleatório e a extensão do tipo detectado.
/// </summary>
public class ImagemUploadService(IWebHostEnvironment env)
{
    public const int MaxImagens = 6;
    public const long TamanhoMaximoBytes = 5 * 1024 * 1024;

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
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var diretorio = Path.Combine(webRoot, "uploads", pasta);
        Directory.CreateDirectory(diretorio);
        var nome = $"{Guid.NewGuid()}{extensao}";
        await using var destino = new FileStream(Path.Combine(diretorio, nome), FileMode.CreateNew);
        await imagem.CopyToAsync(destino);
        return $"/uploads/{pasta}/{nome}";
    }

    public void Remover(IEnumerable<string> urls)
    {
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        foreach (var url in urls)
        {
            var caminho = Path.GetFullPath(Path.Combine(webRoot, url.TrimStart('/')));
            if (caminho.StartsWith(Path.GetFullPath(webRoot)) && File.Exists(caminho)) File.Delete(caminho);
        }
    }

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
