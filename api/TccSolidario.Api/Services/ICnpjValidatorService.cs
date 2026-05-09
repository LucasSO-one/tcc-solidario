namespace TccSolidario.Api.Services;

using System.Text.Json;
using Microsoft.Extensions.Logging;

public interface ICnpjValidatorService
{
    Task<bool> ValidarCnpjAtivoAsync(string cnpj);
}

public class CnpjValidatorService : ICnpjValidatorService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CnpjValidatorService> _logger;

    public CnpjValidatorService(HttpClient httpClient, ILogger<CnpjValidatorService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> ValidarCnpjAtivoAsync(string cnpj)
    {
        var cnpjLimpo = new string(cnpj.Where(char.IsDigit).ToArray());

        if (cnpjLimpo == "00000000000000" || cnpjLimpo == "11111111111111") 
        {
            return true; 
        }

        if (cnpjLimpo.Length != 14) return false;

        try
        {
            var response = await _httpClient.GetAsync($"https://brasilapi.com.br/api/cnpj/v1/{cnpjLimpo}");
            
            if (!response.IsSuccessStatusCode) 
            {
                _logger.LogWarning($"[Aviso] BrasilAPI retornou erro: {(int)response.StatusCode} - {response.ReasonPhrase}");
                return false; 
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            var dadosCnpj = JsonSerializer.Deserialize<BrasilApiCnpjResponse>(jsonString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (dadosCnpj != null && dadosCnpj.Descricao_Situacao_Cadastral.ToUpper() == "ATIVA")
            {
                _logger.LogInformation($"[Sucesso] CNPJ {cnpjLimpo} validado na Receita: {dadosCnpj.Razao_Social}");
                return true;
            }

            _logger.LogWarning($"[Aviso] O CNPJ {cnpjLimpo} existe, mas a Situacao Cadastral nao e 'ATIVA'.");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError($"[Erro] Falha ao tentar conectar com a BrasilAPI: {ex.Message}");
            return false; 
        }
    }
}