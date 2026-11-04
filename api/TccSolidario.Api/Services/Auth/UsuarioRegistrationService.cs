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
        usuario.Email = Seguranca.EmailNormalizado.Normalizar(usuario.Email);
        usuario.EmailNormalizado = usuario.Email;
        if (!Seguranca.EmailNormalizado.Valido(usuario.Email) || !Seguranca.EmailNormalizado.SenhaValida(senhaPura))
            throw new ValidacaoException(new Dictionary<string, string> { ["cadastro"] = "Confira o e-mail e a política de senha (até 72 bytes UTF-8)." });
        if (usuario is Consumidor c && !new CpfValidatorService().ValidarCpf(c.CPF))
            throw new ValidacaoException(new Dictionary<string, string> { ["cpf"] = "CPF inválido." });
        var cnpj = usuario switch { Varejista v => v.CNPJ, Ong o => o.CNPJ, _ => null };
        if (cnpj is not null && !Seguranca.Documentos.CnpjValido(cnpj))
            throw new ValidacaoException(new Dictionary<string, string> { ["cnpj"] = "CNPJ inválido." });
        var emailEmUso = await _context.Usuarios.AnyAsync(u => u.EmailNormalizado == usuario.EmailNormalizado);
        if (emailEmUso)
        {
            _logger.LogWarning("[Registro] Tentativa de cadastro duplicado.");
            throw new ConflictException("Este e-mail já está em uso.");
        }

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(senhaPura, 12);
        usuario.EmailConfirmado = false;

        // Admin não passa por aprovação manual; os demais tipos entram como Pendente
        usuario.StatusAprovacao = usuario.Tipo is TipoUsuario.Admin or TipoUsuario.Consumidor
            ? StatusAprovacao.Aprovado
            : StatusAprovacao.Pendente;

        usuario.DataCriacao = DateTime.UtcNow;

        _context.Add(usuario);
        await _context.SaveChangesAsync();

        _logger.LogInformation("[Registro] Novo {Tipo} cadastrado como {Status}, identificador {Id}.",
            usuario.Tipo, usuario.StatusAprovacao, usuario.Id);

        return usuario;
    }
}