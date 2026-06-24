namespace TccSolidario.Api.DTOs.Consumidor;

using System.ComponentModel.DataAnnotations;

public class RegistroConsumidorRequest
{
    [Required(ErrorMessage = "O CPF e obrigatorio.")]
    [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter exatamente 11 digitos numericos puros.")]
    public string Cpf { get; set; } = string.Empty;

    [Required(ErrorMessage = "O Nome completo e obrigatorio.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O telefone celular e obrigatorio.")]
    [RegularExpression(@"^\(\d{2}\) 9\d{4}-\d{4}$", ErrorMessage = "O telefone deve estar no formato (XX) 9XXXX-XXXX.")]
    public string Telefone { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail e obrigatorio.")]
    [EmailAddress(ErrorMessage = "Formato de e-mail invalido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha e obrigatoria.")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$", 
        ErrorMessage = "A senha deve ter no minimo 8 caracteres, contendo pelo menos uma letra maiuscula, um numero e um caractere especial.")]
    public string Senha { get; set; } = string.Empty;
}