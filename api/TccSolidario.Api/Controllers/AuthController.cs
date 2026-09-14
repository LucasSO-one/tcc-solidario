namespace TccSolidario.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.DTOs.Auth;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext context, ITokenService tokenService, ILogger<AuthController> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _logger = logger;
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

        //Comentado por enquanto !

        // if (usuario.Tipo != TipoUsuario.Admin)
        // {
        //     if (usuario.StatusAprovacao == StatusAprovacao.Pendente)
        //         return Unauthorized(new { Sucesso = false, Erro = "Sua conta ainda está em análise pela nossa equipe." });

        //     if (usuario.StatusAprovacao == StatusAprovacao.Rejeitado)
        //         return Unauthorized(new { Sucesso = false, Erro = "Sua solicitação de cadastro foi rejeitada." });
        // }

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
}