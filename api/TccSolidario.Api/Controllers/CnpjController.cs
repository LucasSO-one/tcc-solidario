namespace TccSolidario.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using TccSolidario.Api.Services;
using TccSolidario.Api.DTOs.Cnpj;

[ApiController]
[Authorize(Roles = "Admin")]
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

        bool isValido = await _cnpjValidator.ValidarCnpjAtivoAsync(request.Cnpj);

        if (isValido)
        {
            return Ok(new { Sucesso = true, Mensagem = "A consulta cadastral retornou situação ativa." });
        }
        else
        {
            return BadRequest(new { Sucesso = false, Erro = "Não foi possível confirmar um CNPJ ativo nesta consulta." });
        }
    }
}