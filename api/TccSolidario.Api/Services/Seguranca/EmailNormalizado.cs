using System.Net.Mail;
using System.Text;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Services.Seguranca;

public static class EmailNormalizado
{
    public static string Normalizar(string? valor) => valor?.Trim().ToLowerInvariant() ?? "";
    public static bool Valido(string valor) => valor.Length <= 254 && valor.All(c => c is > ' ' and < (char)127)
        && MailAddress.TryCreate(valor, out var email) && email.Address == valor;
    public static bool SenhaValida(string? valor) => !string.IsNullOrEmpty(valor)
        && Encoding.UTF8.GetByteCount(valor) <= 72 && System.Text.RegularExpressions.Regex.IsMatch(valor, RegrasSenha.Padrao);
}
