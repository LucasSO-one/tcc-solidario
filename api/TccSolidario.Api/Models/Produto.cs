using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Models;

public class Produto
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Titulo { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public bool FrutaFeia { get; set; } = false;
    public string? ImagemUrl { get; set; }

    public DateTime DataValidade { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecoOriginal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PrecoVenda { get; set; } // Null se for doação pura
    public bool? IsOferta {get;set;}
    public int Quantidade { get; set; }

    public StatusProduto Status { get; set; }

    public bool AlertaPreDoacaoEnviado { get; set; } = false;

    // Foreign Keys
    public Guid VarejistaId { get; set; }
    public Varejista? Varejista { get; set; } // propriedade de navegação

    [ConcurrencyCheck]
    public Guid Versao { get; set; } = Guid.NewGuid();
}
