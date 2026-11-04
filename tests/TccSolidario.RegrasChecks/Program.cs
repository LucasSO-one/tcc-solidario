using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

// Testes unitários puros: sem EF, HTTP, configurações ou conexão de banco.
var agora = new DateTime(2026, 11, 4, 12, 0, 0, DateTimeKind.Utc);
var total = 0;
var falhas = 0;
void Teste(string nome, Action acao)
{
    total++;
    try { acao(); Console.WriteLine($"PASSOU: {nome}"); }
    catch (Exception ex) { falhas++; Console.WriteLine($"FALHOU: {nome}: {ex.Message}"); }
}
void Igual<T>(T esperado, T atual)
{
    if (!EqualityComparer<T>.Default.Equals(esperado, atual))
        throw new Exception($"esperado {esperado}; recebido {atual}");
}
Produto Alimento(DateTime validade, StatusProduto status = StatusProduto.Disponivel) =>
    new() { DataValidade = validade, Status = status, PrecoOriginal = 10m, IsOferta = true };
Transacao Reserva(Produto produto, DateTime expiracao, TipoTransacao tipo = TipoTransacao.Venda) =>
    new() { Produto = produto, ProdutoId = produto.Id, DataExpiracao = expiracao, Tipo = tipo, StatusReserva = StatusReserva.Ativa };

Teste("mais de 24h permanece comercial", () => {
    var p = Alimento(agora.AddHours(24).AddTicks(1)); RegrasCicloVida.AtualizarProduto(p, agora);
    Igual(StatusProduto.Disponivel, p.Status);
});
Teste("exatamente 24h vira doação com preço zero", () => {
    var p = Alimento(agora.AddHours(24), StatusProduto.EmDesconto); p.PrecoVenda = 7m;
    RegrasCicloVida.AtualizarProduto(p, agora); Igual(StatusProduto.DisponivelParaDoacao, p.Status);
    Igual<decimal?>(0m, p.PrecoVenda); Igual<bool?>(false, p.IsOferta); Igual(false, p.AlertaPreDoacaoEnviado);
});
Teste("menos de 24h vira doação", () => {
    var p = Alimento(agora.AddHours(23)); RegrasCicloVida.AtualizarProduto(p, agora); Igual(StatusProduto.DisponivelParaDoacao, p.Status);
});
Teste("exatamente 36h habilita prévia", () => {
    var p = Alimento(agora.AddHours(36)); RegrasCicloVida.AtualizarProduto(p, agora); Igual(true, p.AlertaPreDoacaoEnviado); Igual(StatusProduto.Disponivel, p.Status);
});
Teste("mais de 36h remove prévia antiga", () => {
    var p = Alimento(agora.AddHours(36).AddTicks(1)); p.AlertaPreDoacaoEnviado = true;
    RegrasCicloVida.AtualizarProduto(p, agora); Igual(false, p.AlertaPreDoacaoEnviado);
});
Teste("no instante da validade bloqueia alimento", () => {
    var p = Alimento(agora); RegrasCicloVida.AtualizarProduto(p, agora); Igual(StatusProduto.Vencido, p.Status); Igual<bool?>(false, p.IsOferta);
});
Teste("alimento reservado mantém exclusividade na janela de doação", () => {
    var p = Alimento(agora.AddHours(12), StatusProduto.Reservado); RegrasCicloVida.AtualizarProduto(p, agora); Igual(StatusProduto.Reservado, p.Status);
});
foreach (var status in new[] { StatusProduto.Vendido, StatusProduto.Doado })
    Teste($"histórico {status} preservado após validade", () => {
        var p = Alimento(agora.AddDays(-1), status); RegrasCicloVida.AtualizarProduto(p, agora); Igual(status, p.Status);
    });
Teste("reserva expira exatamente no prazo", () => {
    var p = Alimento(agora.AddDays(3), StatusProduto.Reservado); var t = Reserva(p, agora);
    Igual(true, RegrasCicloVida.ExpirarReserva(t, agora)); Igual(StatusReserva.Expirada, t.StatusReserva); Igual(StatusProduto.Disponivel, p.Status);
});
Teste("reserva não expira um tick antes do prazo", () => {
    var p = Alimento(agora.AddDays(3), StatusProduto.Reservado); var t = Reserva(p, agora.AddTicks(1));
    Igual(false, RegrasCicloVida.ExpirarReserva(t, agora)); Igual(StatusReserva.Ativa, t.StatusReserva);
});
Teste("validade antecipa expiração da reserva", () => {
    var p = Alimento(agora, StatusProduto.Reservado); var t = Reserva(p, agora.AddHours(1));
    Igual(true, RegrasCicloVida.ExpirarReserva(t, agora)); Igual(StatusProduto.Vencido, p.Status);
});
Teste("expiração reaplica janela de doação", () => {
    var p = Alimento(agora.AddHours(20), StatusProduto.Reservado); var t = Reserva(p, agora);
    RegrasCicloVida.ExpirarReserva(t, agora); Igual(StatusProduto.DisponivelParaDoacao, p.Status); Igual<decimal?>(0m, p.PrecoVenda);
});
Teste("cancelamento devolve preço com desconto", () => {
    var p = Alimento(agora.AddDays(3), StatusProduto.Reservado); p.PrecoVenda = 6m; var t = Reserva(p, agora.AddHours(1));
    RegrasCicloVida.CancelarReserva(t, agora); Igual(StatusReserva.Cancelada, t.StatusReserva); Igual(StatusProduto.EmDesconto, p.Status); Igual<decimal?>(6m, p.PrecoVenda);
});
Teste("cancelamento de doação mantém preço zero", () => {
    var p = Alimento(agora.AddDays(3), StatusProduto.Reservado); var t = Reserva(p, agora.AddHours(1), TipoTransacao.Doacao);
    RegrasCicloVida.CancelarReserva(t, agora); Igual(StatusProduto.DisponivelParaDoacao, p.Status); Igual<decimal?>(0m, p.PrecoVenda);
});
Teste("reserva concluída não pode ser cancelada", () => {
    var t = Reserva(Alimento(agora.AddDays(3), StatusProduto.Vendido), agora); t.StatusReserva = StatusReserva.Concluida;
    try { RegrasCicloVida.CancelarReserva(t, agora); } catch (InvalidOperationException) { Igual(StatusReserva.Concluida, t.StatusReserva); return; }
    throw new Exception("cancelamento deveria ser recusado");
});
Teste("reserva já expirada não muda novamente", () => {
    var t = Reserva(Alimento(agora), agora); t.StatusReserva = StatusReserva.Expirada; Igual(false, RegrasCicloVida.ExpirarReserva(t, agora));
});
foreach (var status in Enum.GetValues<StatusProduto>())
    Teste($"edição do lote em situação {status}", () => Igual(status is StatusProduto.Disponivel or StatusProduto.EmDesconto or StatusProduto.DisponivelParaDoacao,
        RegrasCicloVida.Editavel(Alimento(agora.AddDays(3), status))));
foreach (var tipo in Enum.GetValues<TipoUsuario>())
{
    foreach (var status in new[] { StatusAprovacao.Excluido, StatusAprovacao.Rejeitado })
        Teste($"acesso bloqueado para {tipo} {status}", () => Igual(false, RegrasAcesso.PodeAcessar(new Consumidor { Tipo = tipo, StatusAprovacao = status })));
    Teste($"acesso de {tipo} aprovado", () => Igual(true, RegrasAcesso.PodeAcessar(new Consumidor { Tipo = tipo, StatusAprovacao = StatusAprovacao.Aprovado })));
}
foreach (var tipo in new[] { TipoUsuario.ONG, TipoUsuario.Varejista })
    Teste($"instituição {tipo} pendente sem acesso", () => Igual(false, RegrasAcesso.PodeAcessar(new Consumidor { Tipo = tipo, StatusAprovacao = StatusAprovacao.Pendente })));

Console.WriteLine($"RESULTADO: {total - falhas}/{total} testes unitários aprovados; {falhas} falhas.");
Environment.ExitCode = falhas == 0 ? 0 : 1;
