using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TccSolidario.Api.Dtos.Reserva;
using TccSolidario.Api.Services;

namespace TccSolidario.Api.Controllers;

[ApiController]
[Route("api/reservas")]
[Authorize]
public class ReservaController : ControllerBase
{
    private readonly IReservaService _reservaService;

    public ReservaController(IReservaService reservaService)
    {
        _reservaService = reservaService;
    }

    [HttpPost("reservar")]
    public async Task<IActionResult> Reservar(
        [FromBody] CriarReservaRequest request)
    {
        var usuarioId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        try
        {
            var transacao = await _reservaService.ReservarAsync(
                usuarioId,
                request.ProdutoId
            );

            return Ok(new
            {
                transacao.Id,
                message = "Reserva realizada com sucesso.",
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("validar")]
    [Authorize(Roles = "ONG")]
    public async Task<IActionResult> ValidarRetirada(
    [FromBody] ValidarRetiradaRequest request)
    {
        var ongId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        try
        {
            var transacao = await _reservaService.ValidarRetiradaAsync(
                ongId,
                request.Codigo
            );

            return Ok(new
            {
                message = "Retirada confirmada com sucesso.",
                transacao.Id,
                Produto = transacao.Produto!.Titulo
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("minhas")]
    public async Task<IActionResult> ListarMinhasReservas()
    {
        var usuarioId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        var reservas = await _reservaService
            .ListarMinhasReservasAsync(usuarioId);

        return Ok(reservas);
    }

    [HttpGet("validacoes-recentes")]
    [Authorize(Roles = "Varejista")]
    public async Task<IActionResult> ListarValidacoesRecentes()
    {
        var varejistaId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        var validacoes = await _reservaService
            .ListarValidacoesRecentesAsync(varejistaId);

        return Ok(validacoes);
    }

    [HttpGet("reservas-pendentes")]
    [Authorize(Roles = "Varejista")]
    public async Task<IActionResult> ListarReservasPendentes()
    {
        var varejistaId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        var reservas = await _reservaService
            .ListarReservasPendentesAsync(varejistaId);

        return Ok(reservas);
    }
}