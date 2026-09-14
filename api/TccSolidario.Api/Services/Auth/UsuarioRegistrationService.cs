// Services/UsuarioRegistrationService.cs
namespace TccSolidario.Api.Services;

using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Exceptions;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

public class UsuarioRegistrationService : IUsuarioRegistrationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<UsuarioRegistrationService> _logger;

    public UsuarioRegistrationService(AppDbContext context, ILogger<UsuarioRegistrationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<TUsuario> RegistrarAsync<TUsuario>(TUsuario usuario, string senhaPura)
        where TUsuario : Usuario
    {
        var emailEmUso = await _context.Usuarios.AnyAsync(u => u.Email == usuario.Email);
        if (emailEmUso)
        {
            _logger.LogWarning("[Registro] Tentativa de cadastro com e-mail já existente: {Email}", usuario.Email);
            throw new ConflictException("Este e-mail já está em uso.");
        }

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(senhaPura);

        // Admin não passa por aprovação manual; os demais tipos entram como Pendente
        usuario.StatusAprovacao = usuario.Tipo == TipoUsuario.Admin
            ? StatusAprovacao.Aprovado
            : StatusAprovacao.Pendente;

        usuario.DataCriacao = DateTime.UtcNow;

        _context.Add(usuario);
        await _context.SaveChangesAsync();

        _logger.LogInformation("[Registro] Novo {Tipo} cadastrado como {Status}: {Email}",
            usuario.Tipo, usuario.StatusAprovacao, usuario.Email);

        return usuario;
    }
}