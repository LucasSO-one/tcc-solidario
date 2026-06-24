namespace TccSolidario.Api.DTOs.Varejista;

using System.ComponentModel.DataAnnotations;

public class RegistroVarejistaRequest
{
    [Required(ErrorMessage = "O CNPJ e obrigatorio.")]
    [RegularExpression(@"^\d{14}$", ErrorMessage = "O CNPJ deve conter exatamente 14 digitos numericos puros.")]
    public string Cnpj { get; set; } = string.Empty;

    [Required(ErrorMessage = "A Razao Social e obrigatoria.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "A Razao Social deve ter entre 3 e 100 caracteres.")]
    public string RazaoSocial { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail e obrigatorio.")]
    [EmailAddress(ErrorMessage = "Formato de e-mail invalido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha e obrigatoria.")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$", 
        ErrorMessage = "A senha deve ter no minimo 8 caracteres, contendo pelo menos uma letra maiuscula, um numero e um caractere especial.")]
    public string Senha { get; set; } = string.Empty;
}