using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Services.Seguranca;

public sealed class LimiteExcedidoException : Exception;
public sealed class LimiteAutenticacaoService(AppDbContext db, TimeProvider clock)
{
    public async Task ExigirAsync(string finalidade, string chave, int limite, TimeSpan janela)
    {
        await using var operacao = await OperacaoConta.IniciarAsync(db);
        var hash = ProtecaoSegredos.Hash(finalidade + ":" + chave);
        var agora = clock.GetUtcNow().UtcDateTime;
        var row = await db.Set<LimiteAutenticacao>().SingleOrDefaultAsync(r => r.Chave == hash);
        if (row is null) { row = new() { Chave = hash, InicioUtc = agora }; db.Add(row); }
        if (row.InicioUtc + janela <= agora) { row.InicioUtc = agora; row.Tentativas = 0; }
        if (row.Tentativas >= limite) throw new LimiteExcedidoException();
        row.Tentativas++; await db.SaveChangesAsync(); await operacao.CommitAsync();
    }
}
