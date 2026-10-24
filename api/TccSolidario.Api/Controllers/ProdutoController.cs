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
[Authorize]
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
    [Authorize(Roles = "Varejista")]
    // 6 fotos de até 5 MB + campos do formulário
    [RequestSizeLimit(32 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 32 * 1024 * 1024)]
    public async Task<IActionResult> CadastrarLote([FromForm] CadastrarLoteRequest request)
    {
        var varejistaId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            var produto = await _produtoService.CadastrarLoteAsync(varejistaId, request);
            return CreatedAtAction(nameof(CadastrarLote), new { id = produto.Id }, new { produto.Id, Status = produto.Status.ToString(), produto.DataValidade });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("produtos")]
    [Authorize(Roles = "Varejista")]
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

    [HttpGet("{produtoId:guid}")]
    [Authorize(Roles = "Varejista")]
    public async Task<IActionResult> Obter(Guid produtoId)
    {
        try
        {
            return Ok(await _produtoService.ObterDoVarejistaAsync(Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), produtoId));
        }
        catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("{produtoId:guid}")]
    [Authorize(Roles = "Varejista")]
    [RequestSizeLimit(32 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 32 * 1024 * 1024)]
    public async Task<IActionResult> Atualizar(Guid produtoId, [FromForm] AtualizarProdutoRequest request)
    {
        try
        {
            await _produtoService.AtualizarAsync(Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), produtoId, request);
            return Ok(new { message = "Alimento atualizado." });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{produtoId:guid}")]
    [Authorize(Roles = "Varejista")]
    public async Task<IActionResult> Excluir(Guid produtoId)
    {
        try
        {
            await _produtoService.ExcluirAsync(Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), produtoId);
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
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
    [Authorize(Roles = "ONG")]
    public async Task<IActionResult> ListarDoacoes([FromQuery] string? busca, [FromQuery] bool apenasFrutasFeias = false)
    {
        var doacoes = await _produtoService.ListarDoacoesAsync(busca, apenasFrutasFeias);

        return Ok(doacoes);
    }
    [HttpPost("{produtoId:guid}/antecipar-doacao")]
    [Authorize(Roles = "Varejista")]
    public async Task<IActionResult> AnteciparDoacao(Guid produtoId)
    {
        try
        {
            await _produtoService.AnteciparDoacaoAsync(Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), produtoId);
            return Ok(new { message = "Alimento disponibilizado para doação." });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
