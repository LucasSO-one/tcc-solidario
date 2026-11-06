using System.ComponentModel.DataAnnotations;

namespace TccSolidario.Api.DTOs.Auth;

public class ConfirmarMfaRequest
{
    [Required, RegularExpression("^[a-f0-9]{64}$")] public string Desafio { get; set; } = "";
    [MaxLength(6)] public string Codigo { get; set; } = "";
    [MaxLength(40)] public string? CodigoRecuperacao { get; set; }
}
