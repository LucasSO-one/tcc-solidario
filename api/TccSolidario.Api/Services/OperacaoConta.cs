using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using TccSolidario.Api.Data;
namespace TccSolidario.Api.Services;

// Serializa exclusão, alterações de perfil e novas reservas no PostgreSQL.
// Evita reservar com uma conta que estava sendo excluída após a validação do JWT.
public static class OperacaoConta
{
    public static async Task<IDbContextTransaction> IniciarAsync(AppDbContext context)
    {
        var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            if (context.Database.IsNpgsql())
                await context.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(842631907)");
            return transaction;
        }
        catch { await transaction.DisposeAsync(); throw; }
    }
}
