using Microsoft.AspNetCore.Http;

namespace TccSolidario.Api.Dtos.Produto;

public class AtualizarProdutoRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public int Quantidade { get; set; }
    public DateTime DataValidade { get; set; }
    public decimal PrecoOriginal { get; set; }
    public decimal? PrecoDesconto { get; set; }
    public bool? IsOferta { get; set; }
    public bool FrutaFeia { get; set; }
    public List<IFormFile> NovasImagens { get; set; } = new();
    // Ordem final das fotos (a primeira é a capa): URL de uma foto atual ou "nova:{índice em NovasImagens}".
    public List<string> Fotos { get; set; } = new();
}
