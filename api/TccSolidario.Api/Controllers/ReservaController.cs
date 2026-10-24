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
    [Authorize(Roles = "Consumidor,ONG")]
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
                transacao.CodigoRetirada,
                transacao.DataExpiracao,
                DataValidade = transacao.Produto!.DataValidade,
                ProdutoNome = transacao.Produto.Titulo,
                Status = transacao.StatusReserva.ToString(),
                Tipo = transacao.Tipo.ToString(),
                message = "Reserva realizada com sucesso.",
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("validar")]
    [Authorize(Roles = "Varejista")]
    public async Task<IActionResult> ValidarRetirada(
    [FromBody] ValidarRetiradaRequest request)
    {
        var varejistaId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        try
        {
            var transacao = await _reservaService.ValidarRetiradaAsync(
                varejistaId,
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

    [HttpPost("{reservaId:guid}/cancelar")]
    [Authorize(Roles = "Consumidor,ONG")]
    public async Task<IActionResult> Cancelar(Guid reservaId)
    {
        var usuarioId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        try
        {
            await _reservaService.CancelarAsync(usuarioId, reservaId);
            return Ok(new { message = "Reserva cancelada. O alimento voltou a ficar disponível." });
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