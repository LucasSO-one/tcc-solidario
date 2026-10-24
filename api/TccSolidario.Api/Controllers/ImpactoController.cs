using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.Services;

namespace TccSolidario.Api.Controllers;

// Varejista e ONG veem o próprio impacto; o admin vê o da plataforma inteira.
[ApiController]
[Route("api/impacto")]
[Authorize]
public class ImpactoController(ImpactoService impacto) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ImpactoResponse>> Obter()
    {
        var id = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var tipo = Enum.Parse<TipoUsuario>(User.FindFirstValue(ClaimTypes.Role)!);
        return Ok(await impacto.ObterAsync(id, tipo));
    }
}
