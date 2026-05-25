namespace TccSolidario.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TccSolidario.Api.Data;
using TccSolidario.Api.DTOs.Cnpj;
using TccSolidario.Api.DTOs.Varejista;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class VarejistaController : ControllerBase
{
    private readonly ICnpjValidatorService _cnpjValidator;
    private readonly AppDbContext _context;
    private readonly ILogger<VarejistaController> _logger;

    public VarejistaController(ICnpjValidatorService cnpjValidator, AppDbContext context, ILogger<VarejistaController> logger)
    {
        _cnpjValidator = cnpjValidator;
        _context = context;
        _logger = logger;
    }

    [HttpPost("registrar")]
    public async Task<IActionResult> RegistrarVarejista([FromBody] RegistroVarejistaRequest request)
    {
        bool cnpjValido = await _cnpjValidator.ValidarCnpjAtivoAsync(request.Cnpj);
        if (!cnpjValido)
        {
            return BadRequest(new { Sucesso = false, Erro = "CNPJ invalido ou inativo na Receita Federal." });
        }

        bool usuarioExiste = await _context.Usuarios.AnyAsync(u => u.Email == request.Email);
        if (usuarioExiste)
        {
            return BadRequest(new { Sucesso = false, Erro = "Este e-mail ja esta em uso." });
        }

        var novoVarejista = new Varejista
        {
            CNPJ = new string(request.Cnpj.Where(char.IsDigit).ToArray()),
            RazaoSocial = request.RazaoSocial,
            Email = request.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha), // Criptografia ligada!
            Tipo = TipoUsuario.Varejista,
            StatusAprovacao = StatusAprovacao.Pendente,
            DataCriacao = DateTime.UtcNow
        };

        _context.Usuarios.Add(novoVarejista);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"[Registro] Novo varejista cadastrado como Pendente: {novoVarejista.RazaoSocial}");

        return Ok(new { Sucesso = true, Mensagem = "Cadastro realizado com sucesso. Aguardando aprovacao do Administrador." });
    }
}