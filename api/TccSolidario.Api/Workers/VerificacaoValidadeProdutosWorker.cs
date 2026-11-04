using TccSolidario.Api.Services;

public class VerificacaoValidadeProdutosWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VerificacaoValidadeProdutosWorker> _logger;
    private readonly TccSolidario.Api.Services.Seguranca.EstadoOperacao estado;

    public VerificacaoValidadeProdutosWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<VerificacaoValidadeProdutosWorker> logger, TccSolidario.Api.Services.Seguranca.EstadoOperacao estado)
    {
        _scopeFactory = scopeFactory;
        _logger = logger; this.estado = estado;
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
                await produtoService.VerificarValidadesAsync(); estado.Sucesso("validade");
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                estado.Falha("validade"); _logger.LogError("Erro ao verificar validade: {Tipo}.", ex.GetType().Name);
            }

            try { await timer.WaitForNextTickAsync(stoppingToken); } catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }
}