namespace VittaFlow.Api.DTOs
{
    // Resposta enxuta e já pronta pro card do front — sem expor tudo do model Produto.
    public class ProdutoVitrineResponse
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string? ImagemUrl { get; set; }

        // Nome do estabelecimento/varejista que anunciou o produto
        public string NomeVarejista { get; set; } = string.Empty;

        public decimal PrecoOriginal { get; set; }
        public decimal? PrecoDesconto { get; set; }
        
        public bool? IsOferta {get; set;}
        // Calculado no backend pra não repetir a conta no front
        public decimal? DescontoPercentual { get; set; }

        // Dias restantes até a validade (0 = vence hoje)
        public int DiasRestantes { get; set; }

        public bool FrutaFeia { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}