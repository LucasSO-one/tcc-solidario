namespace TccSolidario.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.DTOs.Admin;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    // Injeção de dependência do contexto do banco de dados
    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    // Listar todos os cadastros pendentes
    [HttpGet("usuarios-pendentes")]
    public async Task<IActionResult> GetUsuariosPendentes()
    {
        // Busca no banco todos os usuarios com status Pendente
        var usuariosPendentes = await _context.Usuarios
            .Where(u => u.StatusAprovacao == StatusAprovacao.Pendente && u.Tipo != TipoUsuario.Admin)
            .OrderBy(u => u.DataCriacao)
            .ToListAsync();

        var response = new List<UsuarioPendenteResponse>();

        // Mapeia os dados do banco para o DTO de resposta
        foreach (var usuario in usuariosPendentes)
        {
            var dto = new UsuarioPendenteResponse
            {
                Id = usuario.Id,
                Email = usuario.Email,
                TipoUsuario = usuario.Tipo.ToString(),
                DataSolicitacao = usuario.DataCriacao
            };

            // Verifica se é Varejista ou ONG para pegar o CNPJ e o Nome correto
            if (usuario is Varejista varejista)
            {
                dto.NomeOuRazaoSocial = varejista.RazaoSocial;
                dto.Documento = varejista.CNPJ;
            }
            else if (usuario is Ong ong)
            {
                dto.NomeOuRazaoSocial = ong.NomeResponsavel;
                dto.Documento = ong.CNPJ;
            }

            response.Add(dto);
        }

        return Ok(response);
    }

    // ROTA 2: Aprovar ou Rejeitar um cadastro
    [HttpPut("avaliar-cadastro/{id}")]
    public async Task<IActionResult> AvaliarCadastro(Guid id, [FromBody] AvaliarCadastroRequest request)
    {
        var usuario = await _context.Usuarios.FindAsync(id);

        if (usuario == null)
        {
            return NotFound(new { Sucesso = false, Erro = "Usuario nao encontrado." });
        }

        if (usuario.StatusAprovacao != StatusAprovacao.Pendente)
        {
            return BadRequest(new { Sucesso = false, Erro = "Este cadastro ja foi avaliado anteriormente." });
        }

        // Verifica se o status enviado é válido (2 para Aprovar, 3 para Rejeitar)
        if (request.NovoStatus != StatusAprovacao.Aprovado && request.NovoStatus != StatusAprovacao.Rejeitado)
        {
            return BadRequest(new { Sucesso = false, Erro = "Status invalido. Envie 2 para Aprovar ou 3 para Rejeitar." });
        }

        // Atualiza o status no banco de dados


        usuario.StatusAprovacao = request.NovoStatus;
        
        await _context.SaveChangesAsync();

        string mensagem = request.NovoStatus == StatusAprovacao.Aprovado 
            ? "Cadastro aprovado com sucesso! O usuario ja pode fazer login." 
            : "Cadastro rejeitado.";

        return Ok(new { Sucesso = true, Mensagem = mensagem });
    }
}