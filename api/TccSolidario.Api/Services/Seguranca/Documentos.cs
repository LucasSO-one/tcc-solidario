namespace TccSolidario.Api.Services.Seguranca;

public static class Documentos
{
    public static string NormalizarCnpj(string valor) => new(valor.ToUpperInvariant().Where(char.IsAsciiLetterOrDigit).ToArray());
    public static bool CnpjValido(string valor)
    {
        if (valor.Length != 14 || !valor[..12].All(char.IsAsciiLetterOrDigit) || !valor[12..].All(char.IsAsciiDigit) || valor.Distinct().Count() == 1) return false;
        int Digito(string baseValor, int[] pesos)
        { var soma = baseValor.Select((c, i) => (c - 48) * pesos[i]).Sum(); int resto = soma % 11; return resto < 2 ? 0 : 11 - resto; }
        int d1 = Digito(valor[..12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        int d2 = Digito(valor[..12] + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        return valor.EndsWith($"{d1}{d2}", StringComparison.Ordinal);
    }
}
