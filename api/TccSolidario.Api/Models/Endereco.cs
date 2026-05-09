using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace TccSolidario.Api.Models; 


public class Endereco
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required(ErrorMessage = "A rua é obrigatória")]
    [StringLength(200)]
    public string Rua { get; set; } = string.Empty;

    [Required(ErrorMessage = "O número é obrigatório")]
    [StringLength(20)]
    public string Numero { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Complemento { get; set; }

    [Required(ErrorMessage = "O bairro é obrigatório")]
    [StringLength(100)]
    public string Bairro { get; set; } = string.Empty;

    [Required(ErrorMessage = "A cidade é obrigatória")]
    [StringLength(100)]
    public string Cidade { get; set; } = string.Empty;

    [Required(ErrorMessage = "O estado (UF) é obrigatório")]
    [StringLength(2, MinimumLength = 2, ErrorMessage = "Use a sigla do estado (ex: MG)")]
    public string Estado { get; set; } = string.Empty; // Ex: MG, SP

    [Required(ErrorMessage = "O CEP é obrigatório")]
    [StringLength(8, MinimumLength = 8, ErrorMessage = "O CEP deve ter 8 dígitos (apenas números)")]
    public string CEP { get; set; } = string.Empty;

    // --- Relacionamento (Foreign Key) ---
    
    [Required]
    public Guid UsuarioId { get; set; }

    [ForeignKey("UsuarioId")]
    [JsonIgnore] // Evita ciclo infinito ao serializar JSON
    public Usuario? Usuario { get; set; }
}