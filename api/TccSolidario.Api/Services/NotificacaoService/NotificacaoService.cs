
using TccSolidario.Api.Models;

public class NotificacaoService : INotificacaoService
{
    private readonly ILogger<NotificacaoService> _logger;
    public NotificacaoService(ILogger<NotificacaoService> logger) => _logger = logger;

    public Task EnviarAlertaValidadeAsync(Produto produto)
    {
        // TODO: plugar no seu envio de e-mail/push real
        _logger.LogInformation(
            "Alerta: produto {Titulo} (Id {Id}) do varejista {VarejistaId} vence em breve.",
            produto.Titulo, produto.Id, produto.VarejistaId);
        return Task.CompletedTask;
    }
}