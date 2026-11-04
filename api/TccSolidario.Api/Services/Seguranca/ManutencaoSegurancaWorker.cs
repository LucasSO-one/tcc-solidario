using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;

namespace TccSolidario.Api.Services.Seguranca;

public sealed class ManutencaoSegurancaWorker(IServiceScopeFactory scopes, IConfiguration config, EstadoOperacao estado, ILogger<ManutencaoSegurancaWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(6));
        do
        {
            try
            {
                using var scope = scopes.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var agora = scope.ServiceProvider.GetRequiredService<TimeProvider>().GetUtcNow().UtcDateTime;
                await db.TokensSeguranca.Where(t => t.ExpiraEmUtc < agora.AddDays(-7)).ExecuteDeleteAsync(ct);
                await db.SessoesAutenticacao.Where(s => s.ExpiraEmUtc < agora.AddDays(-7)).ExecuteDeleteAsync(ct);
                await db.EmailsPendentes.Where(e => e.ExpiraEmUtc < agora.AddDays(-30) || e.EnviadoEmUtc < agora.AddDays(-7)).ExecuteDeleteAsync(ct);
                await db.LimitesAutenticacao.Where(l => l.InicioUtc < agora.AddDays(-1)).ExecuteDeleteAsync(ct);
                var limiteAuditoria = agora.AddDays(-Math.Clamp(config.GetValue("Security:AuditRetentionDays", 180), 30, 730));
                await db.EventosAuditoria.Where(e => e.EmUtc < limiteAuditoria).ExecuteDeleteAsync(ct);
                estado.Sucesso("manutencao-seguranca");
            }
            catch (Exception ex) when (!ct.IsCancellationRequested) { estado.Falha("manutencao-seguranca"); logger.LogError("Falha na manutenção de segurança: {Tipo}.", ex.GetType().Name); }
            try { if (!await timer.WaitForNextTickAsync(ct)) break; } catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
        } while (!ct.IsCancellationRequested);
    }
}
