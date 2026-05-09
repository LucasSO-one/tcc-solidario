using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TccSolidario.Api.Services;
using TccSolidario.Api.DTOs.Auth;

[ApiController]
[Route("api/controller")]
public class AuthController : ControllerBase
{
    private readonly ICnpjValidatorService _cnpjValidator;
    private readonly ILogger<AuthController> _logger;

    // injeção de dependência do serviço de validação de CNPJ e do logger
    public AuthController(ICnpjValidatorService cnpjValidator, ILogger<AuthController> logger)
    {
        _cnpjValidator = cnpjValidator;
        _logger = logger;
    }

    [HttpPost("testar-cnpj")]
    public async Task<IActionResult> TestarValidadorCnpj([FromBody] CnpjRequest request)
    {
        _logger.LogInformation($"[Teste] Iniciando validacao para o CNPJ: {request.Cnpj}");

        bool isValido = await _cnpjValidator.ValidarCnpjAtivoAsync(request.Cnpj);

        if (isValido)
        {
            _logger.LogInformation("[Resultado] O CNPJ foi APROVADO.");
            return Ok(new { Sucesso = true, Mensagem = "CNPJ Valido e pronto para cadastro!" });
        }
        else
        {
            _logger.LogWarning("[Resultado] O CNPJ foi REPROVADO.");
            return BadRequest(new { Sucesso = false, Erro = "CNPJ Invalido ou Inativo." });
        }
    }

}

