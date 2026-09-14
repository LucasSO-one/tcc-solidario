namespace TccSolidario.Api.Dtos.Produto;

public class ProdutoResumoResponse
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public DateTime DataValidade { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool? IsOferta { get; set; }
    public string? ImagemUrl { get; set; }
}