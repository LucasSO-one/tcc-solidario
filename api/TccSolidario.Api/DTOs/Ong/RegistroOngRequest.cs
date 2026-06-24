namespace TccSolidario.Api.DTOs.Ong;

using System.ComponentModel.DataAnnotations;

public class RegistroOngRequest
{
    [Required(ErrorMessage = "O CNPJ da ONG e obrigatorio.")]
    [RegularExpression(@"^\d{14}$", ErrorMessage = "O CNPJ deve conter exatamente 14 digitos numericos.")]
    public string Cnpj { get; set; } = string.Empty;

    [Required(ErrorMessage = "O Nome da ONG e obrigatorio.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 100 caracteres.")]
    public string NomeFantasia { get; set; } = string.Empty;

    [Required(ErrorMessage = "O telefone de contato e obrigatorio.")]
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