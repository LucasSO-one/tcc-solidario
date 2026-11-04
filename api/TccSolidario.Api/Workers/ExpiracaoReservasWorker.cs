using TccSolidario.Api.Services;

public class ExpiracaoReservasWorker(IServiceScopeFactory scopes, ILogger<ExpiracaoReservasWorker> logger, TccSolidario.Api.Services.Seguranca.EstadoOperacao estado) : BackgroundService
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
                estado.Sucesso("reservas");
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested) { estado.Falha("reservas"); logger.LogError("Erro ao expirar reservas: {Tipo}.", ex.GetType().Name); }
            try { await timer.WaitForNextTickAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }
}
