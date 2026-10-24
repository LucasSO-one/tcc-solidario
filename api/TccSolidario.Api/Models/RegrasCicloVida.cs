using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Models;

/// <summary>
/// Regras de negócio do ciclo de vida de um alimento (fonte única da verdade).
///
/// 1. Venda: o alimento cadastrado fica na vitrine do consumidor (Disponivel ou EmDesconto)
///    enquanto faltar MAIS de <see cref="HorasParaDoacao"/> horas para vencer.
/// 2. Prévia para ONGs: com <see cref="HorasPreviaOng"/> horas ou menos, o alimento ainda está
///    à venda, mas já aparece para as ONGs como prévia (sem reserva) e o varejista recebe
///    um alerta, podendo antecipar a doação.
/// 3. Doação: com <see cref="HorasParaDoacao"/> horas ou menos, o alimento sai da vitrine do
///    consumidor e passa a DisponivelParaDoacao, com preço zero, exclusivo para ONGs aprovadas.
/// 4. Reserva: cada reserva bloqueia o lote inteiro e gera um código único de retirada.
///    Ela vale por <see cref="HorasReserva"/> horas, encerrando antes se o alimento vencer.
///    Cada usuário pode manter no máximo <see cref="MaxReservasAtivas"/> reservas ativas.
/// 5. Expiração ou cancelamento: o alimento volta para onde estava (venda ou doação) e é
///    reavaliado pelas regras de prazo acima.
/// 6. Retirada: só o varejista dono do alimento confirma, com o código apresentado pelo
///    receptor. O alimento vira Vendido ou Doado e sai de todas as vitrines.
/// 7. Vencimento: ao vencer, qualquer alimento não entregue vira Vencido e fica bloqueado.
/// </summary>
public static class RegrasCicloVida
{
    public const int HorasParaDoacao = 24;
    public const int HorasPreviaOng = 36;
    public const int HorasReserva = 2;
    public const int MaxReservasAtivas = 5;

    public static bool Comercial(Produto produto) =>
        produto.Status is StatusProduto.Disponivel or StatusProduto.EmDesconto;

    // O varejista só edita o que ainda está em alguma vitrine (sem reserva, entrega ou vencimento).
    public static bool Editavel(Produto produto) =>
        Comercial(produto) || produto.Status == StatusProduto.DisponivelParaDoacao;

    public static DateTime LimiteDoacao(DateTime agora) => agora.AddHours(HorasParaDoacao);
    public static DateTime LimitePrevia(DateTime agora) => agora.AddHours(HorasPreviaOng);
    public static DateTime LiberacaoParaDoacao(Produto produto) => produto.DataValidade.AddHours(-HorasParaDoacao);

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
        if (produto.DataValidade <= LimiteDoacao(agora))
            DisponibilizarDoacao(produto);
        else
            produto.AlertaPreDoacaoEnviado = produto.DataValidade <= LimitePrevia(agora);
    }

    public static bool ExpirarReserva(Transacao reserva, DateTime agora)
    {
        if (reserva.StatusReserva != StatusReserva.Ativa || reserva.Produto is null) return false;
        if (reserva.DataExpiracao > agora && reserva.Produto.DataValidade > agora) return false;
        Encerrar(reserva, StatusReserva.Expirada, agora);
        return true;
    }

    public static void CancelarReserva(Transacao reserva, DateTime agora)
    {
        if (reserva.StatusReserva != StatusReserva.Ativa || reserva.Produto is null)
            throw new InvalidOperationException("Somente reservas ativas podem ser canceladas.");
        Encerrar(reserva, StatusReserva.Cancelada, agora);
    }

    // Devolve o alimento para a vitrine de origem e reaplica as regras de prazo.
    private static void Encerrar(Transacao reserva, StatusReserva status, DateTime agora)
    {
        var produto = reserva.Produto!;
        reserva.StatusReserva = status;
        if (produto.Status == StatusProduto.Reservado)
        {
            if (reserva.Tipo == TipoTransacao.Doacao)
                DisponibilizarDoacao(produto);
            else
                produto.Status = produto.PrecoVenda.HasValue
                    ? StatusProduto.EmDesconto : StatusProduto.Disponivel;
        }
        AtualizarProduto(produto, agora);
    }
}
