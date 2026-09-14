using Microsoft.AspNetCore.Http;

namespace TccSolidario.Api.Dtos.Produto;

public class CadastrarLoteRequest
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
    public IFormFile? Imagem { get; set; }
}