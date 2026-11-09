namespace TccSolidario.Api.Services;

using System.Text.Json;
using Microsoft.Extensions.Logging;
using TccSolidario.Api.Services.Seguranca;

public interface ICnpjValidatorService
{
    Task<bool> ValidarCnpjAtivoAsync(string cnpj);
}

public class CnpjValidatorService(HttpClient httpClient, ILogger<CnpjValidatorService> logger) : ICnpjValidatorService
{
    public async Task<bool> ValidarCnpjAtivoAsync(string cnpj)
    {
        var normalizado = Documentos.NormalizarCnpj(cnpj ?? "");
        // Esta consulta é limitada a CNPJs numéricos; a validação local aceita também alfanuméricos.
        if (normalizado.Length != 14 || !normalizado.All(char.IsAsciiDigit) || !Documentos.CnpjValido(normalizado))
            return false;
        try
        {
            using var response = await httpClient.GetAsync($"https://brasilapi.com.br/api/cnpj/v1/{normalizado}");
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Consulta cadastral indisponível. HTTP {Status}.", (int)response.StatusCode);
                return false;
            }
            var json = await response.Content.ReadAsStringAsync();
            var cadastro = JsonSerializer.Deserialize<BrasilApiCnpjResponse>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return string.Equals(cadastro?.Descricao_Situacao_Cadastral, "ATIVA", StringComparison.OrdinalIgnoreCase);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            logger.LogWarning("Não foi possível concluir a consulta cadastral. Categoria {Categoria}.", ex.GetType().Name);
            return false;
        }
    }
}
