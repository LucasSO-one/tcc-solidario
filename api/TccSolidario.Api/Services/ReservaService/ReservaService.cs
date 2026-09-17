using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Dtos.Reserva;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Services;

public class ReservaService : IReservaService
{
    private readonly AppDbContext _context;

    public ReservaService(AppDbContext context)
    {
        _context = context;
    }

    public static class CodigoRetiradaGenerator
    {
        private const string Caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0,O,1,I
        private static readonly Random _random = new();

        public static string Gerar()
        {
            Span<char> buffer = stackalloc char[7]; // XXX-XXX
            for (int i = 0; i < 3; i++)
                buffer[i] = Caracteres[_random.Next(Caracteres.Length)];

            buffer[3] = '-';

            for (int i = 4; i < 7; i++)
                buffer[i] = Caracteres[_random.Next(Caracteres.Length)];

            return new string(buffer);
        }
    }

    public async Task<Transacao> ReservarAsync(Guid usuarioId, Guid produtoId)
    {
        var produto = await _context.Produtos
            .FirstOrDefaultAsync(p => p.Id == produtoId);

        if (produto is null)
            throw new InvalidOperationException("Produto não encontrado.");

        var statusReservaveis = new[]
        {
            StatusProduto.Disponivel,
            StatusProduto.EmDesconto,
            StatusProduto.DisponivelParaDoacao
        };

        if (!statusReservaveis.Contains(produto.Status))
            throw new InvalidOperationException(
                "Este produto não está mais disponível para reserva."
            );

        var tipo = produto.Status == StatusProduto.DisponivelParaDoacao
            ? TipoTransacao.Doacao
            : TipoTransacao.Venda;

        var transacao = new Transacao
        {
            ProdutoId = produto.Id,

            Tipo = tipo,

            CodigoRetirada = await GerarCodigoUnicoAsync(),

            DataTransacao = DateTime.UtcNow,

            ValorFinal = tipo == TipoTransacao.Doacao
                ? 0
                : produto.PrecoVenda ?? produto.PrecoOriginal
        };

        // Define quem realizou a reserva.
        // Aqui precisamos identificar se o usuário é Consumidor ou ONG.
        var consumidor = await _context.Consumidores
            .AnyAsync(c => c.Id == usuarioId);

        if (consumidor)
        {
            transacao.ConsumidorId = usuarioId;
        }
        else
        {
            var ong = await _context.Ongs
                .AnyAsync(o => o.Id == usuarioId);

            if (!ong)
                throw new InvalidOperationException(
                    "Usuário não encontrado como consumidor ou ONG."
                );

            transacao.OngId = usuarioId;
        }

        // O alimento deixa de estar disponível
        // enquanto estiver reservado.
        produto.Status = StatusProduto.Reservado;

        _context.Transacoes.Add(transacao);

        await _context.SaveChangesAsync();

        return transacao;
    }

    public async Task<Transacao> ValidarRetiradaAsync(
        Guid varejistaId,
        string codigo)
    {
        var codigoNormalizado = codigo
            .Trim()
            .ToUpperInvariant();

        var transacao = await _context.Transacoes
            .Include(t => t.Produto)
            .FirstOrDefaultAsync(
                t => t.CodigoRetirada == codigoNormalizado
            );

        if (transacao is null)
            throw new InvalidOperationException(
                "Código de retirada inválido."
            );

        if (transacao.Produto is null)
            throw new InvalidOperationException(
                "Produto da transação não encontrado."
            );

        if (transacao.Produto.VarejistaId != varejistaId)
            throw new InvalidOperationException(
                "Este código não pertence a um produto do seu estabelecimento."
            );

        // O produto precisa estar reservado.
        if (transacao.Produto.Status != StatusProduto.Reservado)
            throw new InvalidOperationException(
                "Este produto não está mais reservado."
            );

        transacao.DataTransacao = DateTime.UtcNow;
        transacao.DataRetirada = DateTime.UtcNow;

        // Depois da retirada:
        // Venda -> Vendido
        // Doação -> Doado
        transacao.Produto.Status =
            transacao.Tipo == TipoTransacao.Doacao
                ? StatusProduto.Doado
                : StatusProduto.Vendido;

        await _context.SaveChangesAsync();

        return transacao;
    }

    public async Task<List<ReservaResponse>> ListarMinhasReservasAsync(
        Guid usuarioId)
    {
        var transacoes = await _context.Transacoes
            .Include(t => t.Produto)
            .Where(t =>
                t.ConsumidorId == usuarioId ||
                t.OngId == usuarioId
            )
            .OrderByDescending(t => t.DataTransacao)
            .ToListAsync();

        return transacoes
            .Select(MapParaResponse)
            .ToList();
    }

    public async Task<List<ReservaResponse>> ListarValidacoesRecentesAsync(
        Guid varejistaId)
    {
        var transacoes = await _context.Transacoes
            .Include(t => t.Produto)
            .Where(t =>
                t.Produto!.VarejistaId == varejistaId &&
                (
                    t.Produto.Status == StatusProduto.Vendido ||
                    t.Produto.Status == StatusProduto.Doado
                )
            )
            .OrderByDescending(t => t.DataRetirada)
            .Take(20)
            .ToListAsync();

        return transacoes
            .Select(MapParaResponse)
            .ToList();
    }

    private async Task<string> GerarCodigoUnicoAsync()
    {
        string codigo;
        bool existe;

        do
        {
            codigo = CodigoRetiradaGenerator.Gerar();

            existe = await _context.Transacoes
                .AnyAsync(t => t.CodigoRetirada == codigo);

        } while (existe);

        return codigo;
    }

    private static ReservaResponse MapParaResponse(Transacao t)
    {
        return new ReservaResponse
        {
            Id = t.Id,
            ProdutoId = t.ProdutoId,
            ProdutoNome = t.Produto!.Titulo,
            CodigoRetirada = t.CodigoRetirada,
            Tipo = t.Tipo.ToString(),
            Status = t.Produto.Status.ToString(),
            ValorFinal = t.ValorFinal,
            DataReserva = t.DataTransacao,
            DataRetirada = t.DataRetirada
        };
    }
}