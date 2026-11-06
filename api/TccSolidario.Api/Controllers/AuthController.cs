using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.DTOs.Auth;
using TccSolidario.Api.Services.Seguranca;

namespace TccSolidario.Api.Controllers;

[ApiController]
[Route("api/auth")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class AuthController(AutenticacaoService auth, AppDbContext db, IWebHostEnvironment env, TimeProvider clock) : ControllerBase
{
    public static string CookieNome(bool producao) => producao ? "__Host-vittaflow-session" : "vittaflow-session";
    private CookieOptions CookieOpcoes => new() { HttpOnly = true, Secure = env.IsProduction(), SameSite = SameSiteMode.Strict, Path = "/", IsEssential = true, MaxAge = TimeSpan.FromHours(8) };
    [HttpGet("csrf")]
    public IActionResult Csrf([FromServices] IAntiforgery antiforgery) => Ok(new { token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });
    [HttpPost("login")]
    [RequestSizeLimit(8192)]
    public async Task<IActionResult> Login(LoginRequest request) => Responder(await auth.LoginAsync(request.Email, request.Senha));
    [HttpPost("mfa/confirmar")]
    [RequestSizeLimit(8192)]
    public async Task<IActionResult> ConfirmarMfa(ConfirmarMfaRequest request) => Responder(await auth.ConfirmarMfaAsync(request.Desafio, request.Codigo, request.CodigoRecuperacao));
    private IActionResult Responder(ResultadoAutenticacao r)
    {
        if (r.Erro is not null) return Unauthorized(new { sucesso = false, erro = r.Erro });
        if (r.Jwt is not null) Response.Cookies.Append(CookieNome(env.IsProduction()), r.Jwt, CookieOpcoes);
        return Ok(new { sucesso = true, usuario = r.Usuario is null ? null : new { r.Usuario.Id, r.Usuario.Email, Tipo = r.Usuario.Tipo.ToString() },
            requerMfa = r.Desafio is not null, configurarMfa = r.ConfigurarMfa, desafio = r.Desafio, segredo = r.Segredo,
            uriAutenticador = r.UriAutenticador, codigosRecuperacao = r.CodigosRecuperacao });
    }
    [Authorize]
    [HttpGet("sessao")]
    public IActionResult Sessao() => Ok(new { id = User.FindFirstValue(ClaimTypes.NameIdentifier), email = User.FindFirstValue(ClaimTypes.Email), tipo = User.FindFirstValue(ClaimTypes.Role) });
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (Guid.TryParse(User.FindFirstValue("vfsid"), out var id))
            await db.SessoesAutenticacao.Where(s => s.Id == id).ExecuteUpdateAsync(s => s.SetProperty(s => s.RevogadaEmUtc, clock.GetUtcNow().UtcDateTime));
        Response.Cookies.Delete(CookieNome(env.IsProduction()), CookieOpcoes);
        return Ok(new { sucesso = true });
    }
}
