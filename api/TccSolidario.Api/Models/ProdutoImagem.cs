namespace TccSolidario.Api.Models;

// Foto de um alimento. Ordem 0 é a capa.
public class ProdutoImagem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProdutoId { get; set; }
    public Produto? Produto { get; set; }
    public string Url { get; set; } = string.Empty;
    public int Ordem { get; set; }
}
