namespace TccSolidario.Api.Controllers;

using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authorization; // <-- Adicionado para o [Authorize]
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.DTOs.Auth;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.Models;
using TccSolidario.Api.Services;
using TccSolidario.Api.Services.Auth; // <-- Adicionado para localizar o ILogoutService

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthController> _logger;
    private readonly ILogoutService _logoutService;

    public AuthController(
        AppDbContext context, 
        ITokenService tokenService, 
        ILogoutService logoutService, // <-- Corrigido: injetando a interface ILogoutService
        ILogger<AuthController> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _logger = logger;
        _logoutService = logoutService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
        {
            // mesma mensagem pros dois casos, evita enumeração de e-mails cadastrados
            return Unauthorized(new { Sucesso = false, Erro = "Credenciais inválidas." });
        }

        if (!RegrasAcesso.PodeAcessar(usuario))
            return Unauthorized(new { Sucesso = false, Erro = usuario.StatusAprovacao == StatusAprovacao.Rejeitado
                ? "Sua solicitação de cadastro foi rejeitada."
                : "Sua conta ainda está em análise pela nossa equipe." });

        var token = _tokenService.GerarTokenJwt(usuario);

        _logger.LogInformation("[Login] Usuário autenticado: {Email}", usuario.Email);

        return Ok(new
        {
            Sucesso = true,
            Token = token,
            Usuario = new
            {
                Id = usuario.Id,
                Email = usuario.Email,
                Tipo = usuario.Tipo.ToString()
            }
        });
    }

    [Authorize] // Garante que apenas quem tem um token válido pode acessar
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // 1. Pega o token que vem no cabeçalho (Header) da requisição
        var authHeader = Request.Headers["Authorization"].ToString();
        
        if (!AuthenticationHeaderValue.TryParse(authHeader, out var authorization)
            || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(authorization.Parameter))
        {
            return BadRequest(new { Sucesso = false, Erro = "Token não fornecido ou em formato inválido." });
        }

        // 2. Remove a palavra "Bearer " para ficar apenas com a string do JWT
        var token = authorization.Parameter;

        // 3. Manda o token para a lista negra
        _logoutService.InvalidarToken(token);

        return Ok(new { Sucesso = true, Mensagem = "Logout realizado com sucesso." });
    }
}