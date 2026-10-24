using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TccSolidario.Api.DTOs.Conta;
using TccSolidario.Api.Exceptions;
using TccSolidario.Api.Services;

namespace TccSolidario.Api.Controllers;

// Cada usuário só acessa e altera a própria conta (o id vem do token, nunca da URL).
[ApiController]
[Route("api/conta")]
[Authorize]
public class ContaController(ContaService contas) : ControllerBase
{
    private Guid UsuarioId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<ContaResponse>> Obter() => Ok(await contas.ObterAsync(UsuarioId));

    [HttpPut]
    public Task<IActionResult> Atualizar([FromBody] AtualizarContaRequest request) =>
        Executar(async () => Ok(await contas.AtualizarAsync(UsuarioId, request)));

    [HttpPut("senha")]
    public Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequest request) =>
        Executar(async () => { await contas.AlterarSenhaAsync(UsuarioId, request); return NoContent(); });

    [HttpPost("foto")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public Task<IActionResult> AtualizarFoto(IFormFile? foto) =>
        Executar(async () => Ok(new { fotoUrl = await contas.AtualizarFotoAsync(UsuarioId, foto) }));

    [HttpGet("tipos-estabelecimento")]
    public IActionResult TiposEstabelecimento() => Ok(ContaService.TiposEstabelecimento);

    private async Task<IActionResult> Executar(Func<Task<IActionResult>> acao)
    {
        try { return await acao(); }
        catch (ValidacaoException ex) { return BadRequest(new { message = ex.Message, erros = ex.Erros }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
