using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Services;

public record EvolucaoMes(string Mes, int Doadas, int Vendidas);
public record ImpactoResponse(Dictionary<string, int> Indicadores, List<EvolucaoMes> Evolucao);

/// <summary>
/// Indicadores de impacto calculados só com retiradas CONCLUÍDAS (o alimento chegou a alguém).
/// Unidades = soma da quantidade dos lotes retirados. O sistema não registra peso (kg).
/// </summary>
public class ImpactoService(AppDbContext context, TimeProvider clock)
{
    private const int MesesEvolucao = 6;

    public async Task<ImpactoResponse> ObterAsync(Guid usuarioId, TipoUsuario tipo)
    {
        var concluidas = context.Transacoes.AsNoTracking().Include(t => t.Produto)
            .Where(t => t.StatusReserva == StatusReserva.Concluida);
        concluidas = tipo switch
        {
            TipoUsuario.Varejista => concluidas.Where(t => t.Produto!.VarejistaId == usuarioId),
            TipoUsuario.ONG => concluidas.Where(t => t.OngId == usuarioId),
            TipoUsuario.Consumidor => concluidas.Where(t => t.ConsumidorId == usuarioId),
            _ => concluidas
        };
        var lista = await concluidas.Select(t => new
        {
            t.Tipo, t.OngId, t.DataRetirada, t.DataTransacao,
            Quantidade = t.Produto!.Quantidade, VarejistaId = t.Produto.VarejistaId
        }).ToListAsync();
        var doacoes = lista.Where(t => t.Tipo == TipoTransacao.Doacao).ToList();
        var vendas = lista.Where(t => t.Tipo == TipoTransacao.Venda).ToList();

        var indicadores = new Dictionary<string, int>();
        switch (tipo)
        {
            case TipoUsuario.Varejista:
                indicadores["alimentosSalvos"] = lista.Sum(t => t.Quantidade);
                indicadores["unidadesDoadas"] = doacoes.Sum(t => t.Quantidade);
                indicadores["doacoesRealizadas"] = doacoes.Count;
                indicadores["ongsAtendidas"] = doacoes.Select(t => t.OngId).Distinct().Count();
                break;
            case TipoUsuario.ONG:
                indicadores["unidadesRecebidas"] = doacoes.Sum(t => t.Quantidade);
                indicadores["doacoesRecebidas"] = doacoes.Count;
                indicadores["estabelecimentosParceiros"] = doacoes.Select(t => t.VarejistaId).Distinct().Count();
                break;
            case TipoUsuario.Consumidor:
                indicadores["alimentosComprados"] = vendas.Sum(t => t.Quantidade);
                indicadores["retiradas"] = vendas.Count;
                break;
            default:
                indicadores["alimentosSalvos"] = lista.Sum(t => t.Quantidade);
                indicadores["doacoesRealizadas"] = doacoes.Count;
                indicadores["ongsAtendidas"] = doacoes.Select(t => t.OngId).Distinct().Count();
                indicadores["varejistasAtivos"] = await context.Varejistas.CountAsync(v => v.StatusAprovacao == StatusAprovacao.Aprovado);
                indicadores["alimentosCadastrados"] = await context.Produtos.CountAsync();
                indicadores["usuarios"] = await context.Usuarios.CountAsync(u => u.Tipo != TipoUsuario.Admin);
                indicadores["cadastrosPendentes"] = await context.Usuarios.CountAsync(u => u.StatusAprovacao == StatusAprovacao.Pendente);
                break;
        }

        var agora = clock.GetUtcNow().UtcDateTime;
        var inicio = new DateTime(agora.Year, agora.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(MesesEvolucao - 1));
        var evolucao = Enumerable.Range(0, MesesEvolucao).Select(i =>
        {
            var mes = inicio.AddMonths(i);
            bool NoMes(DateTime? data) => data is { } d && d.Year == mes.Year && d.Month == mes.Month;
            return new EvolucaoMes(mes.ToString("yyyy-MM"),
                doacoes.Where(t => NoMes(t.DataRetirada ?? t.DataTransacao)).Sum(t => t.Quantidade),
                vendas.Where(t => NoMes(t.DataRetirada ?? t.DataTransacao)).Sum(t => t.Quantidade));
        }).ToList();

        return new ImpactoResponse(indicadores, evolucao);
    }
}
