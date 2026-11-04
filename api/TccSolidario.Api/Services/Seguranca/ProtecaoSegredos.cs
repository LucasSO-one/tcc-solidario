using System.Security.Cryptography;
using System.Text;

namespace TccSolidario.Api.Services.Seguranca;

public sealed class ProtecaoSegredos
{
    private readonly byte[] chave;
    public ProtecaoSegredos(IConfiguration config, IWebHostEnvironment ambiente)
    {
        var valor = config["Security:EncryptionKey"];
        if (string.IsNullOrWhiteSpace(valor) && !ambiente.IsProduction())
            chave = SHA256.HashData(Encoding.UTF8.GetBytes("vittaflow-development-only:" + config["Jwt:Key"]));
        else
        {
            try { chave = Convert.FromBase64String(valor ?? ""); }
            catch (FormatException) { throw new InvalidOperationException("Security__EncryptionKey deve ser uma chave Base64 de 32 bytes."); }
            if (chave.Length != 32) throw new InvalidOperationException("Configure Security__EncryptionKey com 32 bytes aleatórios em Base64.");
        }
    }
    public string Proteger(string valor, string finalidade)
    {
        var nonce = RandomNumberGenerator.GetBytes(12);
        var texto = Encoding.UTF8.GetBytes(valor);
        var cifrado = new byte[texto.Length]; var tag = new byte[16];
        using var aes = new AesGcm(chave, 16);
        aes.Encrypt(nonce, texto, cifrado, tag, Encoding.UTF8.GetBytes(finalidade));
        return Convert.ToBase64String(nonce.Concat(tag).Concat(cifrado).ToArray());
    }
    public string Desproteger(string valor, string finalidade)
    {
        var bytes = Convert.FromBase64String(valor);
        if (bytes.Length < 28) throw new CryptographicException("Segredo protegido inválido.");
        var texto = new byte[bytes.Length - 28];
        using var aes = new AesGcm(chave, 16);
        aes.Decrypt(bytes.AsSpan(0, 12), bytes.AsSpan(28), bytes.AsSpan(12, 16), texto, Encoding.UTF8.GetBytes(finalidade));
        return Encoding.UTF8.GetString(texto);
    }
    public static string NovoToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
    public static string Hash(string valor) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(valor))).ToLowerInvariant();
}
