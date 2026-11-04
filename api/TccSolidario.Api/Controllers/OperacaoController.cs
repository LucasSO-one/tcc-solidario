using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Services.Seguranca;

namespace TccSolidario.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/operacao")]
public class OperacaoController(AppDbContext db, EstadoOperacao estado, TimeProvider clock) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Obter()
    {
        var agora = clock.GetUtcNow().UtcDateTime;
        return Ok(new { workers = estado.Snapshot(),
            emailsPendentes = await db.EmailsPendentes.CountAsync(e => !e.Cancelado && e.EnviadoEmUtc == null && e.ExpiraEmUtc > agora),
            emailsSemEntrega = await db.EmailsPendentes.CountAsync(e => !e.Cancelado && e.EnviadoEmUtc == null && (e.Tentativas >= 5 || e.ExpiraEmUtc <= agora)),
            sessoesAtivas = await db.SessoesAutenticacao.CountAsync(s => s.RevogadaEmUtc == null && s.ExpiraEmUtc > agora
                && db.Usuarios.Any(u => u.Id == s.UsuarioId && u.VersaoSeguranca == s.VersaoUsuario)),
            auditoria = await db.EventosAuditoria.AsNoTracking().OrderByDescending(e => e.EmUtc).Take(100)
                .Select(e => new { e.Id, e.UsuarioId, e.EntidadeId, e.Acao, e.Sucesso, e.EmUtc }).ToListAsync() });
    }
}
