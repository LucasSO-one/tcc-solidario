namespace TccSolidario.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using System.Linq;
using TccSolidario.Api.DTOs.Varejista;
using TccSolidario.Api.DTOs.Ong;
using TccSolidario.Api.DTOs.Consumidor;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.Services;

[ApiController]
[Route("api/registro")]
public class RegistroController : ControllerBase
{
    private readonly ICnpjValidatorService _cnpjValidator;
    private readonly IUsuarioRegistrationService _registrationService;
    private readonly TccSolidario.Api.Data.AppDbContext _db;

    public RegistroController(
        ICnpjValidatorService cnpjValidator,
        IUsuarioRegistrationService registrationService, TccSolidario.Api.Data.AppDbContext db)
    {
        _cnpjValidator = cnpjValidator;
        _registrationService = registrationService;
        _db = db;
    }

    [HttpPost("varejista")]
    public async Task<IActionResult> RegistrarVarejista(RegistroVarejistaRequest request)
    {
        // if (!await _cnpjValidator.ValidarCnpjAtivoAsync(request.Cnpj))
        //     return BadRequest(new { Sucesso = false, Erro = "CNPJ inválido ou inativo na Receita Federal." });

        var varejista = new Varejista
        {
            Nome = request.RazaoSocial,
            NomeEstabelecimento = request.NomeEstabelecimento,
            CNPJ = Services.Seguranca.Documentos.NormalizarCnpj(request.Cnpj),
            RazaoSocial = request.RazaoSocial,
            Email = request.Email,
            Tipo = TipoUsuario.Varejista
        };

        await using var operacao = await Services.OperacaoConta.IniciarAsync(_db);
        await _registrationService.RegistrarAsync(varejista, request.Senha);
        await operacao.CommitAsync();
        return Ok(new { Sucesso = true, Mensagem = "Cadastro recebido. Aguarde a aprovação administrativa para acessar." });
    }

    [HttpPost("ong")]
    public async Task<IActionResult> RegistrarOng(RegistroOngRequest request)
    {
        // if (!await _cnpjValidator.ValidarCnpjAtivoAsync(request.Cnpj))
        //     return BadRequest(new { Sucesso = false, Erro = "CNPJ inválido ou inativo na Receita Federal." });

        var ong = new Ong
        {
            Nome = request.NomeFantasia,
            CNPJ = Services.Seguranca.Documentos.NormalizarCnpj(request.Cnpj),
            NomeFantasia = request.NomeFantasia,
            Telefone = request.Telefone,
            Email = request.Email,
            Tipo = TipoUsuario.ONG
        };

        await using var operacao = await Services.OperacaoConta.IniciarAsync(_db);
        await _registrationService.RegistrarAsync(ong, request.Senha);
        await operacao.CommitAsync();
        return Ok(new { Sucesso = true, Mensagem = "Cadastro recebido. Aguarde a aprovação administrativa para acessar." });
    }

    [HttpPost("consumidor")]
    public async Task<IActionResult> RegistrarConsumidor(RegistroConsumidorRequest request)
    {
        var consumidor = new Consumidor
        {
            Nome = request.Nome,
            CPF = SomenteDigitos(request.Cpf),
            Telefone = request.Telefone,
            Email = request.Email,
            Tipo = TipoUsuario.Consumidor
        };

        await using var operacao = await Services.OperacaoConta.IniciarAsync(_db);
        await _registrationService.RegistrarAsync(consumidor, request.Senha);
        await operacao.CommitAsync();
        return Ok(new { Sucesso = true, Mensagem = "Cadastro realizado. Você já pode entrar com seu e-mail e senha." });
    }

    private static string SomenteDigitos(string valor) => new(valor.Where(char.IsDigit).ToArray());
}