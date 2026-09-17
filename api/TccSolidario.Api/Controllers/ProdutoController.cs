using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TccSolidario.Api.Data;
using TccSolidario.Api.Dtos.Produto;
using TccSolidario.Api.Services;
using VittaFlow.Api.DTOs;

namespace TccSolidario.Api.Controllers;

[ApiController]
[Route("api/produtos")]
[Authorize(Roles = "Varejista")]
public class ProdutoController : ControllerBase
{
    private readonly IProdutoService _produtoService;
    private readonly AppDbContext _context;

    public ProdutoController(IProdutoService produtoService, AppDbContext context)
    {
        _produtoService = produtoService;
        _context = context;
    }

    [HttpPost("cadastrar-lote")]
    public async Task<IActionResult> CadastrarLote([FromForm] CadastrarLoteRequest request)
    {
        var varejistaId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            var produto = await _produtoService.CadastrarLoteAsync(varejistaId, request);
            return CreatedAtAction(nameof(CadastrarLote), new { id = produto.Id }, produto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("produtos")]
    public async Task<IActionResult> ListarPorVarejista()
    {
        var claimId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(claimId, out var varejistaId))
        {
            return Unauthorized(new { message = "Usuário inválido." });
        }

        var produtos = await _produtoService.ListarPorVarejistaAsync(varejistaId);
        return Ok(produtos);
    }

    [HttpGet("vitrine")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ProdutoVitrineResponse>>> ListarVitrine(
    [FromQuery] string? busca,
    [FromQuery] bool apenasFrutasFeias = false)
    {
        var produtos = await _produtoService.ListarVitrineAsync(busca, apenasFrutasFeias);
        return Ok(produtos);
    }

    [HttpGet("ofertas")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarOfertas([FromQuery] string? busca)
    {
        var ofertas = await _produtoService.ListarOfertasAsync(busca);

        return Ok(ofertas);
    }

    [HttpGet("doacoes")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarDoacoes([FromQuery] string? busca)
    {
        var doacoes = await _produtoService.ListarDoacoesAsync(busca);

        return Ok(doacoes);
    }
}