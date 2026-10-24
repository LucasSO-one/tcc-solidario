namespace TccSolidario.Api.DTOs.Varejista;

using System.ComponentModel.DataAnnotations;
using TccSolidario.Api.Models;

public class RegistroVarejistaRequest
{
    [Required(ErrorMessage = "O nome do estabelecimento é obrigatório.")]
    [StringLength(150, ErrorMessage = "O nome do estabelecimento deve ter no máximo 150 caracteres.")]
    public string NomeEstabelecimento { get; set; } = string.Empty;
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
    [RegularExpression(RegrasSenha.Padrao, ErrorMessage = RegrasSenha.Mensagem)]
    public string Senha { get; set; } = string.Empty;
}