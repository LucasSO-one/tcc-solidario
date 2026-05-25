namespace TccSolidario.Api.DTOs.Varejista;
using System.ComponentModel.DataAnnotations;

public class RegistroVarejistaRequest
{
    [Required(ErrorMessage = "O CNPJ e obrigatorio.")]
    [StringLength(14, MinimumLength = 14, ErrorMessage = "O CNPJ deve ter exatamente 14 digitos.")]
    public string Cnpj { get; set; } = string.Empty;

    [Required(ErrorMessage = "A Razao Social e obrigatoria.")]
    public string RazaoSocial { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail e obrigatorio.")]
    [EmailAddress(ErrorMessage = "Formato de e-mail invalido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha e obrigatoria.")]
    [MinLength(6, ErrorMessage = "A senha deve ter no minimo 6 caracteres.")]
    public string Senha { get; set; } = string.Empty;
}