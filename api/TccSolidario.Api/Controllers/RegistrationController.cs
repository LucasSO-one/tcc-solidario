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

    public RegistroController(
        ICnpjValidatorService cnpjValidator,
        IUsuarioRegistrationService registrationService)
    {
        _cnpjValidator = cnpjValidator;
        _registrationService = registrationService;
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
            CNPJ = SomenteDigitos(request.Cnpj),
            RazaoSocial = request.RazaoSocial,
            Email = request.Email,
            Tipo = TipoUsuario.Varejista
        };

        await _registrationService.RegistrarAsync(varejista, request.Senha);
        return Ok(new { Sucesso = true, Mensagem = "Cadastro realizado. Aguardando aprovação." });
    }

    [HttpPost("ong")]
    public async Task<IActionResult> RegistrarOng(RegistroOngRequest request)
    {
        // if (!await _cnpjValidator.ValidarCnpjAtivoAsync(request.Cnpj))
        //     return BadRequest(new { Sucesso = false, Erro = "CNPJ inválido ou inativo na Receita Federal." });

        var ong = new Ong
        {
            Nome = request.NomeFantasia,
            CNPJ = SomenteDigitos(request.Cnpj),
            NomeFantasia = request.NomeFantasia,
            Telefone = request.Telefone,
            Email = request.Email,
            Tipo = TipoUsuario.ONG
        };

        await _registrationService.RegistrarAsync(ong, request.Senha);
        return Ok(new { Sucesso = true, Mensagem = "Cadastro realizado. Aguardando aprovação." });
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

        await _registrationService.RegistrarAsync(consumidor, request.Senha);
        return Ok(new { Sucesso = true, Mensagem = "Cadastro realizado com sucesso." });
    }

    private static string SomenteDigitos(string valor) => new(valor.Where(char.IsDigit).ToArray());
}