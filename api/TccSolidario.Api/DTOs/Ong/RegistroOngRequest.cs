namespace TccSolidario.Api.DTOs.Ong;

using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

public class RegistroOngRequest
{
    [Required(ErrorMessage = "O CNPJ da ONG e obrigatorio.")]
    [RegularExpression(@"^\d{14}$", ErrorMessage = "O CNPJ deve conter exatamente 14 digitos numericos.")]
    public string Cnpj { get; set; } = string.Empty;

    [Required(ErrorMessage = "O Nome da ONG e obrigatorio.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string NomeFantasia { get; set; } = string.Empty;

    [Required(ErrorMessage = "O telefone de contato e obrigatorio.")]
    public string Telefone { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail e obrigatorio.")]
    [EmailAddress(ErrorMessage = "Formato de e-mail invalido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha e obrigatoria.")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$",
        ErrorMessage = "A senha deve ter no minimo 8 caracteres, contendo pelo menos uma letra maiuscula, um numero e um caractere especial.")]
    public string Senha { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var telefoneLimpo = Regex.Replace(Telefone ?? string.Empty, @"\D", "");

        if (telefoneLimpo.Length != 11 || telefoneLimpo[2] != '9')
        {
            yield return new ValidationResult(
                "Informe um celular válido com DDD e 9 dígitos.",
                new[] { nameof(Telefone) }
            );
        }

        Telefone = telefoneLimpo;
    }
}