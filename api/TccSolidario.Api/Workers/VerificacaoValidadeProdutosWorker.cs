using TccSolidario.Api.Services;

public class VerificacaoValidadeProdutosWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VerificacaoValidadeProdutosWorker> _logger;

    public VerificacaoValidadeProdutosWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<VerificacaoValidadeProdutosWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var produtoService = scope.ServiceProvider.GetRequiredService<IProdutoService>();
                await produtoService.VerificarValidadesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar validade dos produtos.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }
}