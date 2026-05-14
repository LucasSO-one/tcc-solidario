namespace TccSolidario.Api.DTOs.Admin;

public class UsuarioPendenteResponse
{
    public Guid Id { get; set; }
    public string NomeOuRazaoSocial { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty; // CNPJ ou CPF
    public string Email { get; set; } = string.Empty;
    public string TipoUsuario { get; set; } = string.Empty;
    public DateTime DataSolicitacao { get; set; }
}