namespace TccSolidario.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TccSolidario.Api.Services;
using TccSolidario.Api.DTOs.Cnpj;

[ApiController]
[Route("api/[controller]")]
public class CnpjController : ControllerBase
{
    private readonly ICnpjValidatorService _cnpjValidator;
    private readonly ILogger<CnpjController> _logger;

    public CnpjController(ICnpjValidatorService cnpjValidator, ILogger<CnpjController> logger)
    {
        _cnpjValidator = cnpjValidator;
        _logger = logger;
    }

    [HttpPost("testar-validacao")]
    public async Task<IActionResult> TestarValidadorCnpj([FromBody] CnpjRequest request)
    {
        _logger.LogInformation($"[Teste] Iniciando validacao isolada para o CNPJ: {request.Cnpj}");

        bool isValido = await _cnpjValidator.ValidarCnpjAtivoAsync(request.Cnpj);

        if (isValido)
        {
            return Ok(new { Sucesso = true, Mensagem = "CNPJ Valido e Ativo na Receita!" });
        }
        else
        {
            return BadRequest(new { Sucesso = false, Erro = "CNPJ Invalido ou Inativo." });
        }
    }
}