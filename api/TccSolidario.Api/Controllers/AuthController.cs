namespace TccSolidario.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TccSolidario.Api.DTOs.Auth;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext context, IConfiguration configuration, ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (usuario == null)
        {
            return Unauthorized(new { Sucesso = false, Erro = "Credenciais invalidas." });
        }

        if (usuario.Tipo != TipoUsuario.Admin)
        {
            if (usuario.StatusAprovacao == StatusAprovacao.Pendente)
            {
                return Unauthorized(new { Sucesso = false, Erro = "Sua conta ainda esta em analise pela nossa equipe." });
            }
            
            if (usuario.StatusAprovacao == StatusAprovacao.Rejeitado)
            {
                return Unauthorized(new { Sucesso = false, Erro = "Sua solicitacao de cadastro foi rejeitada." });
            }
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
        {
            return Unauthorized(new { Sucesso = false, Erro = "Credenciais invalidas." });
        }

        var token = GerarTokenJwt(usuario);

        _logger.LogInformation($"[Login] Usuario autenticado: {usuario.Email}");

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

    private string GerarTokenJwt(Usuario usuario)
    {
        var jwtKey = _configuration["Jwt:Key"];
        var key = Encoding.ASCII.GetBytes(jwtKey!);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim("TipoUsuario", usuario.Tipo.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key), 
                SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}