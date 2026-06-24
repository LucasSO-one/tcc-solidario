namespace TccSolidario.Api.DTOs.Cnpj;

using System.ComponentModel.DataAnnotations;

public class CnpjRequest
{
    [Required(ErrorMessage = "O CNPJ e obrigatorio.")]
    [RegularExpression(@"^\d{14}$", ErrorMessage = "O CNPJ para teste deve conter exatamente 14 digitos numericos.")]
    public string Cnpj { get; set; } = string.Empty;
}