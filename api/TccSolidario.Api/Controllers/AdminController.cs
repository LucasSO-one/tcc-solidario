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

    // Todos os usuários (exceto administradores). CPF é mascarado: o admin não precisa do documento completo.
    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios()
    {
        var usuarios = await context.Usuarios.AsNoTracking().Where(u => u.Tipo != TipoUsuario.Admin)
            .OrderByDescending(u => u.DataCriacao).ToListAsync();
        return Ok(usuarios.Select(u => new
        {
            u.Id, u.Email, Tipo = u.Tipo.ToString(), Status = u.StatusAprovacao.ToString(), u.DataCriacao,
            Nome = u switch { Varejista v => v.NomeEstabelecimento, Ong o => o.NomeFantasia, _ => u.Nome },
            Documento = u switch
            {
                Varejista v => v.CNPJ, Ong o => o.CNPJ,
                Consumidor c when c.CPF.Length == 11 => $"***.{c.CPF[3..6]}.{c.CPF[6..9]}-**", _ => ""
            }
        }));
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
