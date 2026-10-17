using TccSolidario.Api.Services;

public class ExpiracaoReservasWorker(IServiceScopeFactory scopes, ILogger<ExpiracaoReservasWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<CicloVidaService>().ExpirarReservasAsync();
            }
            catch (Exception ex) { logger.LogError(ex, "Erro ao expirar reservas."); }
            try { await timer.WaitForNextTickAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }
}
