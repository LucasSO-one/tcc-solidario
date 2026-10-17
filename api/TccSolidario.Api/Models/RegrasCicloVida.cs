using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Models;

public static class RegrasCicloVida
{
    public static bool Comercial(Produto produto) =>
        produto.Status is StatusProduto.Disponivel or StatusProduto.EmDesconto;

    public static void DisponibilizarDoacao(Produto produto)
    {
        produto.Status = StatusProduto.DisponivelParaDoacao;
        produto.PrecoVenda = 0m;
        produto.IsOferta = false;
        produto.AlertaPreDoacaoEnviado = false;
    }

    public static void AtualizarProduto(Produto produto, DateTime agora)
    {
        if (produto.Status is StatusProduto.Vendido or StatusProduto.Doado) return;
        if (produto.DataValidade <= agora)
        {
            produto.Status = StatusProduto.Vencido;
            produto.IsOferta = false;
            produto.AlertaPreDoacaoEnviado = false;
            return;
        }
        if (!Comercial(produto)) return;
        if (produto.DataValidade <= agora.AddHours(24))
            DisponibilizarDoacao(produto);
        else
            produto.AlertaPreDoacaoEnviado = produto.DataValidade <= agora.AddHours(36);
    }

    public static bool ExpirarReserva(Transacao reserva, DateTime agora)
    {
        if (reserva.StatusReserva != StatusReserva.Ativa || reserva.Produto is null) return false;
        var produto = reserva.Produto;
        if (reserva.DataExpiracao > agora && produto.DataValidade > agora) return false;
        reserva.StatusReserva = StatusReserva.Expirada;
        if (produto.Status == StatusProduto.Reservado)
        {
            if (reserva.Tipo == TipoTransacao.Doacao)
                DisponibilizarDoacao(produto);
            else
                produto.Status = produto.PrecoVenda.HasValue
                    ? StatusProduto.EmDesconto : StatusProduto.Disponivel;
        }
        AtualizarProduto(produto, agora);
        return true;
    }
}
