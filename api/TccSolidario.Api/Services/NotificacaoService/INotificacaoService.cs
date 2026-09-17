using TccSolidario.Api.Models;

public interface INotificacaoService
{
    Task EnviarAlertaValidadeAsync(Produto produto);
}
