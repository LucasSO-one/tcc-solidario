using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TccSolidario.Api.Models.Enums;
namespace TccSolidario.Api.Models;
public class Transacao
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public DateTime DataTransacao { get; set; } = DateTime.UtcNow;

    [Required]
    public TipoTransacao Tipo { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ValorFinal { get; set; }

    [StringLength(255)]
    public string? HashSeguranca { get; set; }

    [Required]
    public Guid ProdutoId { get; set; }

    public Produto? Produto { get; set; }

    [StringLength(20)]
    public string CodigoRetirada { get; set; } = string.Empty;

    public DateTime? DataRetirada { get; set; }

    public Guid? ConsumidorId { get; set; }
    public Consumidor? Consumidor { get; set; }

    public Guid? OngId { get; set; }
    public Ong? Ong { get; set; }
}