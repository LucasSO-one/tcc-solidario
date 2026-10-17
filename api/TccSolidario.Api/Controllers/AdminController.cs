using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.DTOs.Admin;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController(AppDbContext context) : ControllerBase
{
    [HttpGet("usuarios-pendentes")]
    public async Task<IActionResult> GetUsuariosPendentes() => Ok(await Listar(StatusAprovacao.Pendente));

    [HttpGet("cadastros")]
    public async Task<IActionResult> GetCadastros([FromQuery] StatusAprovacao? status)
    {
        if (status.HasValue && !Enum.IsDefined(status.Value)) return BadRequest(new { message = "Status inválido." });
        return Ok(await Listar(status));
    }

    private async Task<List<object>> Listar(StatusAprovacao? status)
    {
        var query = context.Usuarios.AsNoTracking().Where(u => u.Tipo == TipoUsuario.ONG || u.Tipo == TipoUsuario.Varejista);
        if (status.HasValue) query = query.Where(u => u.StatusAprovacao == status.Value);
        var usuarios = await query.OrderBy(u => u.DataCriacao).ToListAsync();
        return usuarios.Select(u => (object)new
        {
            u.Id, u.Email, TipoUsuario = u.Tipo.ToString(), DataSolicitacao = u.DataCriacao,
            Status = u.StatusAprovacao.ToString(),
            NomeOuRazaoSocial = u is Varejista v ? v.NomeEstabelecimento : ((Ong)u).NomeFantasia,
            Documento = u is Varejista varejista ? varejista.CNPJ : ((Ong)u).CNPJ
        }).ToList();
    }

    [HttpPut("avaliar-cadastro/{id:guid}")]
    public async Task<IActionResult> AvaliarCadastro(Guid id, [FromBody] AvaliarCadastroRequest request)
    {
        var usuario = await context.Usuarios.FindAsync(id);
        if (usuario is null || usuario.Tipo is not (TipoUsuario.ONG or TipoUsuario.Varejista))
            return NotFound(new { message = "Cadastro institucional não encontrado." });
        if (usuario.StatusAprovacao != StatusAprovacao.Pendente)
            return BadRequest(new { message = "Este cadastro já foi avaliado." });
        if (request.NovoStatus is not (StatusAprovacao.Aprovado or StatusAprovacao.Rejeitado))
            return BadRequest(new { message = "Informe 2 para aprovar ou 3 para rejeitar." });
        usuario.StatusAprovacao = request.NovoStatus;
        await context.SaveChangesAsync();
        return Ok(new { message = request.NovoStatus == StatusAprovacao.Aprovado ? "Cadastro aprovado." : "Cadastro rejeitado." });
    }
}
