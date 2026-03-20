using System.ComponentModel.DataAnnotations.Schema;


public class Produto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    
    public DateTime DataValidade { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecoOriginal { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? PrecoVenda { get; set; } // Null se for doação pura
    
    public int Quantidade { get; set; }
    
    public StatusProduto Status { get; set; }

    public bool AlertaPreDoacaoEnviado { get; set; } = false;

    // Foreign Keys
    public Guid VarejistaId { get; set; }
    public Varejista? Varejista { get; set; } // propriedade de naegação
    
    // Métodos de Domínio 
    public void VerificarGatilhoDoacao()
    {
        // Exemplo: Se faltam menos de 24h e ainda não foi vendido
        var horasRestantes = (DataValidade - DateTime.UtcNow).TotalHours;
        
        if (horasRestantes <= 24 && Status == StatusProduto.EmDesconto)
        {
            Status = StatusProduto.DisponivelParaDoacao;
            PrecoVenda = 0;
        }
    }

    public void VerificarGatilhosDeTempo()
    {
        // Se já foi reservado, vendido, doado ou vencido, o tempo não mexe mais nele
        if (Status != StatusProduto.EmDesconto && Status != StatusProduto.Disponivel) 
            return;

        var horasRestantes = (DataValidade - DateTime.UtcNow).TotalHours;

        if (horasRestantes <= 0)
        {
            Status = StatusProduto.Vencido;
        }
        else if (horasRestantes <= 24)
        {
            Status = StatusProduto.DisponivelParaDoacao;
            PrecoVenda = 0m;
        }
        else if (horasRestantes <= 36 && !AlertaPreDoacaoEnviado)
        {
            AlertaPreDoacaoEnviado = true;
            // O Backend vai ler essa flag para gerar a notificação amarela no Dashboard
        }
    }
}