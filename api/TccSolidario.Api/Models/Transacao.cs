using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


public class Transacao
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public DateTime DataTransacao { get; set; } = DateTime.UtcNow;

    [Required]
    public TipoTransacao Tipo { get; set; } // Venda ou Doacao

    [Column(TypeName = "decimal(18,2)")]
    public decimal ValorFinal { get; set; } // 0.00 se for doação

    // --- Rastreabilidade Legal (Lei 14.016) ---
    // O Hash só é gerado se for Doação. Se for Venda, pode ser nulo ou o ID do Pedido.
    [StringLength(255)]
    public string? HashSeguranca { get; set; } 


    [Required]
    public Guid ProdutoId { get; set; }
    
    // O JsonIgnore evita ciclo se você serializar a transação
    public Produto? Produto { get; set; }

    
    public Guid? ConsumidorId { get; set; }
    public Consumidor? Consumidor { get; set; }

    public Guid? OngId { get; set; }
    public Ong? Ong { get; set; }

    
}