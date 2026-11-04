using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;

namespace TccSolidario.Api.Services.Seguranca;

public static class Totp
{
    private const string Alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    public static string NovoSegredo() => Base32(RandomNumberGenerator.GetBytes(20));
    public static string Base32(byte[] dados)
    {
        var s = new StringBuilder(); int bits = 0, buffer = 0;
        foreach (var b in dados) { buffer = (buffer << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; s.Append(Alfabeto[(buffer >> bits) & 31]); } }
        if (bits > 0) s.Append(Alfabeto[(buffer << (5 - bits)) & 31]);
        return s.ToString();
    }
    private static byte[] Decodificar(string valor)
    {
        var bytes = new List<byte>(); int bits = 0, buffer = 0;
        foreach (var c in valor) { int n = Alfabeto.IndexOf(c); if (n < 0) throw new FormatException("Chave TOTP inválida."); buffer = (buffer << 5) | n; bits += 5; if (bits >= 8) { bits -= 8; bytes.Add((byte)(buffer >> bits)); } }
        return bytes.ToArray();
    }
    public static string Gerar(string segredo, long passo, int digitos = 6)
    {
        Span<byte> contador = stackalloc byte[8]; BinaryPrimitives.WriteInt64BigEndian(contador, passo);
        var hash = HMACSHA1.HashData(Decodificar(segredo), contador);
        int offset = hash[^1] & 15;
        var numero = BinaryPrimitives.ReadInt32BigEndian(hash.AsSpan(offset, 4)) & 0x7fffffff;
        return (numero % (digitos == 8 ? 100000000 : 1000000)).ToString(digitos == 8 ? "D8" : "D6");
    }
    public static long? Validar(string segredo, string codigo, DateTimeOffset agora, long ultimoPasso)
    {
        if (codigo.Length != 6 || !codigo.All(char.IsAsciiDigit)) return null;
        long atual = agora.ToUnixTimeSeconds() / 30;
        for (long passo = atual - 1; passo <= atual + 1; passo++)
            if (passo > ultimoPasso && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(Gerar(segredo, passo)), Encoding.ASCII.GetBytes(codigo))) return passo;
        return null;
    }
}
