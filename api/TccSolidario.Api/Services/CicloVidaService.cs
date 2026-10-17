using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Services;

public class CicloVidaService(AppDbContext context, TimeProvider clock)
{
    public async Task ExpirarReservasAsync()
    {
        var agora = clock.GetUtcNow().UtcDateTime;
        var reservas = await context.Transacoes.Include(t => t.Produto)
            .Where(t => t.StatusReserva == StatusReserva.Ativa &&
                (t.DataExpiracao <= agora || t.Produto!.DataValidade <= agora))
            .ToListAsync();
        foreach (var reserva in reservas) RegrasCicloVida.ExpirarReserva(reserva, agora);
        await context.SaveChangesAsync();
    }

    public async Task AtualizarAsync()
    {
        await ExpirarReservasAsync();
        var agora = clock.GetUtcNow().UtcDateTime;
        var produtos = await context.Produtos.Where(p =>
            p.Status != StatusProduto.Vendido && p.Status != StatusProduto.Doado &&
            p.Status != StatusProduto.Vencido).ToListAsync();
        foreach (var produto in produtos) RegrasCicloVida.AtualizarProduto(produto, agora);
        await context.SaveChangesAsync();
    }
}
