using System.ComponentModel.DataAnnotations;

namespace TccSolidario.Api.DTOs.Auth;

public class EmailRequest
{
    [Required, EmailAddress, MaxLength(254)] public string Email { get; set; } = "";
}
public class LinkRequest
{
    [Required, RegularExpression("^[a-f0-9]{64}$")] public string Token { get; set; } = "";
}
public class RedefinirSenhaRequest : LinkRequest
{
    [Required, MaxLength(256)] public string NovaSenha { get; set; } = "";
}
public class ConfirmarMfaRequest
{
    [Required, RegularExpression("^[a-f0-9]{64}$")] public string Desafio { get; set; } = "";
    [MaxLength(6)] public string Codigo { get; set; } = "";
    [MaxLength(40)] public string? CodigoRecuperacao { get; set; }
}
