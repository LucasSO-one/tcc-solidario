using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Dtos.Reserva;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Services;

public class ReservaService(AppDbContext context, CicloVidaService ciclo, TimeProvider clock) : IReservaService
{
    public async Task<Transacao> ReservarAsync(Guid usuarioId, Guid produtoId)
    {
        var usuario = await context.Usuarios.SingleOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario is null || !RegrasAcesso.PodeAcessar(usuario))
            throw new InvalidOperationException("Cadastro não autorizado para realizar reservas.");
        if (usuario.Tipo is not (TipoUsuario.Consumidor or TipoUsuario.ONG))
            throw new InvalidOperationException("Apenas consumidores e ONGs podem reservar alimentos.");

        await ciclo.AtualizarAsync();
        var ativas = await context.Transacoes.CountAsync(t => t.StatusReserva == StatusReserva.Ativa &&
            (t.ConsumidorId == usuarioId || t.OngId == usuarioId));
        if (ativas >= RegrasCicloVida.MaxReservasAtivas)
            throw new InvalidOperationException(
                $"Você já possui {RegrasCicloVida.MaxReservasAtivas} reservas ativas. Retire ou cancele uma antes de reservar outra.");
        var produto = await context.Produtos.Include(p => p.Varejista).SingleOrDefaultAsync(p => p.Id == produtoId)
            ?? throw new InvalidOperationException("Produto não encontrado.");
        var agora = clock.GetUtcNow().UtcDateTime;
        RegrasCicloVida.AtualizarProduto(produto, agora);
        if (produto.DataValidade <= agora)
            throw new InvalidOperationException("Este alimento já venceu e não pode ser reservado.");
        if (produto.Varejista is null || !RegrasAcesso.PodeAcessar(produto.Varejista))
            throw new InvalidOperationException("Estabelecimento indisponível.");
        var doacao = produto.Status == StatusProduto.DisponivelParaDoacao;
        if (!doacao && !RegrasCicloVida.Comercial(produto))
            throw new InvalidOperationException("Este produto não está mais disponível para reserva.");
        if (usuario.Tipo == TipoUsuario.Consumidor && doacao)
            throw new InvalidOperationException("Doações são exclusivas para ONGs aprovadas.");
        if (usuario.Tipo == TipoUsuario.ONG && !doacao)
            throw new InvalidOperationException("Aguarde a liberação do alimento para doação.");

        var reserva = new Transacao
        {
            ProdutoId = produto.Id,
            Produto = produto,
            Tipo = doacao ? TipoTransacao.Doacao : TipoTransacao.Venda,
            CodigoRetirada = await GerarCodigoUnicoAsync(),
            DataTransacao = agora,
            DataExpiracao = agora.AddHours(RegrasCicloVida.HorasReserva),
            StatusReserva = StatusReserva.Ativa,
            ValorFinal = doacao ? 0m : produto.PrecoVenda ?? produto.PrecoOriginal,
            ConsumidorId = usuario.Tipo == TipoUsuario.Consumidor ? usuarioId : null,
            OngId = usuario.Tipo == TipoUsuario.ONG ? usuarioId : null
        };
        produto.Status = StatusProduto.Reservado;
        produto.AlertaPreDoacaoEnviado = false;
        context.Transacoes.Add(reserva);
        // A versão do produto e o índice único de reserva ativa protegem a concorrência.
        await context.SaveChangesAsync();
        return reserva;
    }

    public async Task<Transacao> ValidarRetiradaAsync(Guid varejistaId, string codigo)
    {
        var varejista = await context.Varejistas.SingleOrDefaultAsync(v => v.Id == varejistaId);
        if (varejista is null || !RegrasAcesso.PodeAcessar(varejista))
            throw new InvalidOperationException("Varejista não autorizado.");
        await ciclo.AtualizarAsync();
        var normalizado = (codigo ?? string.Empty).Trim().ToUpperInvariant();
        var reserva = await context.Transacoes.Include(t => t.Produto)
            .SingleOrDefaultAsync(t => t.CodigoRetirada == normalizado && normalizado != "");
        if (reserva?.Produto is null || reserva.Produto.VarejistaId != varejistaId)
            throw new InvalidOperationException("Código inválido para este estabelecimento.");
        var agora = clock.GetUtcNow().UtcDateTime;
        if (RegrasCicloVida.ExpirarReserva(reserva, agora)) await context.SaveChangesAsync();
        if (reserva.StatusReserva != StatusReserva.Ativa || reserva.DataRetirada.HasValue)
            throw new InvalidOperationException($"Esta reserva não está mais ativa (situação: {reserva.StatusReserva}).");
        if (reserva.DataExpiracao <= agora || reserva.Produto.DataValidade <= agora ||
            reserva.Produto.Status != StatusProduto.Reservado)
            throw new InvalidOperationException("Reserva indisponível ou alimento vencido.");
        reserva.StatusReserva = StatusReserva.Concluida;
        reserva.DataRetirada = agora;
        reserva.Produto.Status = reserva.Tipo == TipoTransacao.Doacao ? StatusProduto.Doado : StatusProduto.Vendido;
        await context.SaveChangesAsync();
        return reserva;
    }

    public async Task CancelarAsync(Guid usuarioId, Guid reservaId)
    {
        var reserva = await context.Transacoes.Include(t => t.Produto)
            .SingleOrDefaultAsync(t => t.Id == reservaId && (t.ConsumidorId == usuarioId || t.OngId == usuarioId))
            ?? throw new InvalidOperationException("Reserva não encontrada.");
        var agora = clock.GetUtcNow().UtcDateTime;
        if (RegrasCicloVida.ExpirarReserva(reserva, agora))
        {
            await context.SaveChangesAsync();
            throw new InvalidOperationException("Esta reserva já expirou.");
        }
        RegrasCicloVida.CancelarReserva(reserva, agora);
        await context.SaveChangesAsync();
    }

    private IQueryable<Transacao> Consulta() => context.Transacoes.AsNoTracking()
        .Include(t => t.Produto).ThenInclude(p => p!.Varejista)
        .Include(t => t.Ong).Include(t => t.Consumidor);

    public async Task<List<ReservaResponse>> ListarMinhasReservasAsync(Guid usuarioId)
    {
        await ciclo.AtualizarAsync();
        var reservas = await Consulta().Where(t => t.ConsumidorId == usuarioId || t.OngId == usuarioId)
            .OrderByDescending(t => t.DataTransacao).ToListAsync();
        return reservas.Select(t => MapParaResponse(t, true)).ToList();
    }

    public async Task<List<ReservaResponse>> ListarReservasPendentesAsync(Guid varejistaId)
    {
        await ciclo.AtualizarAsync();
        var reservas = await Consulta().Where(t => t.Produto!.VarejistaId == varejistaId &&
            t.StatusReserva == StatusReserva.Ativa).OrderBy(t => t.DataExpiracao).ToListAsync();
        return reservas.Select(t => MapParaResponse(t, false)).ToList();
    }

    public async Task<List<ReservaResponse>> ListarValidacoesRecentesAsync(Guid varejistaId)
    {
        var reservas = await Consulta().Where(t => t.Produto!.VarejistaId == varejistaId &&
            t.StatusReserva == StatusReserva.Concluida).OrderByDescending(t => t.DataRetirada)
            .Take(20).ToListAsync();
        return reservas.Select(t => MapParaResponse(t, false)).ToList();
    }

    private async Task<string> GerarCodigoUnicoAsync()
    {
        const string caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        string codigo;
        do
        {
            var letras = Enumerable.Range(0, 8).Select(_ => caracteres[RandomNumberGenerator.GetInt32(caracteres.Length)]);
            codigo = new string(letras.ToArray()).Insert(4, "-");
        } while (await context.Transacoes.AnyAsync(t => t.CodigoRetirada == codigo));
        return codigo;
    }

    private static ReservaResponse MapParaResponse(Transacao t, bool mostrarCodigo) => new()
    {
        Id = t.Id, ProdutoId = t.ProdutoId, ProdutoNome = t.Produto!.Titulo,
        CodigoRetirada = mostrarCodigo && t.StatusReserva == StatusReserva.Ativa ? t.CodigoRetirada : "",
        // O varejista vê apenas o final do código para conferir; o código completo fica só com o receptor.
        FinalCodigo = t.StatusReserva == StatusReserva.Ativa && t.CodigoRetirada.Length >= 4 ? t.CodigoRetirada[^4..] : "",
        Tipo = t.Tipo.ToString(), Status = t.StatusReserva.ToString(),
        ValorFinal = t.ValorFinal, DataReserva = t.DataTransacao,
        DataExpiracao = t.DataExpiracao, DataValidade = t.Produto.DataValidade,
        DataRetirada = t.DataRetirada,
        NomeReceptor = t.Ong?.NomeFantasia ?? t.Consumidor?.Nome ?? "Usuário",
        NomeVarejista = t.Produto.Varejista?.NomeEstabelecimento ?? "Estabelecimento"
    };
}
