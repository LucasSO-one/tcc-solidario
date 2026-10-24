using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.DTOs.Conta;
using TccSolidario.Api.Exceptions;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Services;

/// <summary>
/// Dados da própria conta. Regras:
/// - CNPJ e razão social são somente leitura (foram conferidos na aprovação do cadastro);
/// - trocar o e-mail (que é o login) exige a senha atual e um e-mail ainda não usado;
/// - a nova senha segue a mesma política do cadastro (<see cref="RegrasSenha"/>).
/// </summary>
public partial class ContaService(AppDbContext context, ImagemUploadService uploads)
{
    public const long TamanhoMaximoFoto = 2 * 1024 * 1024;
    public static readonly string[] TiposEstabelecimento =
        ["Supermercado", "Mercearia", "Padaria", "Hortifrúti", "Restaurante", "Lanchonete", "Feira ou produtor", "Outro"];

    public async Task<ContaResponse> ObterAsync(Guid usuarioId) => Mapear(await Carregar(usuarioId));

    public async Task<ContaResponse> AtualizarAsync(Guid usuarioId, AtualizarContaRequest request)
    {
        var usuario = await Carregar(usuarioId);
        var erros = new Dictionary<string, string>();
        var nome = request.Nome?.Trim() ?? "";
        var email = request.Email?.Trim() ?? "";
        var telefone = SomenteDigitos(request.Telefone);

        if (nome.Length is < 3 or > 100) erros["nome"] = "Informe um nome entre 3 e 100 caracteres.";
        if (!EmailValido().IsMatch(email)) erros["email"] = "Informe um e-mail válido.";
        else if (!string.Equals(email, usuario.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrEmpty(request.SenhaAtual) || !BCrypt.Net.BCrypt.Verify(request.SenhaAtual, usuario.SenhaHash))
                erros["senhaAtual"] = "Confirme a senha atual para alterar o e-mail.";
            else if (await context.Usuarios.AnyAsync(u => u.Id != usuarioId && u.Email.ToLower() == email.ToLower()))
                erros["email"] = "Este e-mail já está em uso.";
        }
        if (telefone.Length is not (0 or 10 or 11)) erros["telefone"] = "Informe um telefone com DDD (10 ou 11 dígitos).";

        var org = request.Organizacao ?? new OrganizacaoDto();
        if (usuario is Varejista)
        {
            if (string.IsNullOrWhiteSpace(org.NomeEstabelecimento) || org.NomeEstabelecimento.Trim().Length > 150)
                erros["organizacao.nomeEstabelecimento"] = "Informe o nome do estabelecimento (até 150 caracteres).";
            if (!string.IsNullOrEmpty(org.TipoEstabelecimento) && !TiposEstabelecimento.Contains(org.TipoEstabelecimento))
                erros["organizacao.tipoEstabelecimento"] = "Escolha um tipo de estabelecimento da lista.";
        }
        if (usuario is Ong)
        {
            if (string.IsNullOrWhiteSpace(org.NomeFantasia) || org.NomeFantasia.Trim().Length > 100)
                erros["organizacao.nomeFantasia"] = "Informe o nome fantasia (até 100 caracteres).";
            if (org.CapacidadeRecebimento?.Length > 100) erros["organizacao.capacidadeRecebimento"] = "Use até 100 caracteres.";
        }
        if (org.HorarioFuncionamento?.Length > 120) erros["organizacao.horarioFuncionamento"] = "Use até 120 caracteres.";
        if (usuario is Varejista or Ong && request.Endereco is not null) ValidarEndereco(request.Endereco, erros);

        if (erros.Count > 0) throw new ValidacaoException(erros);

        usuario.Nome = nome;
        usuario.Email = email;
        usuario.Telefone = telefone;
        usuario.NotificarNovasSolicitacoes = request.Notificacoes.NovasSolicitacoes;
        usuario.NotificarVencimentos = request.Notificacoes.Vencimentos;
        usuario.NotificarDoacoesConcluidas = request.Notificacoes.DoacoesConcluidas;
        switch (usuario)
        {
            case Varejista v:
                v.NomeEstabelecimento = org.NomeEstabelecimento!.Trim();
                v.TipoEstabelecimento = Vazio(org.TipoEstabelecimento);
                v.HorarioFuncionamento = Vazio(org.HorarioFuncionamento);
                break;
            case Ong o:
                o.NomeFantasia = org.NomeFantasia!.Trim();
                o.AreaAtuacao = org.AreaAtuacao?.Trim() ?? "";
                o.CapacidadeRecebimento = Vazio(org.CapacidadeRecebimento);
                o.HorarioFuncionamento = Vazio(org.HorarioFuncionamento);
                break;
        }
        if (usuario is Varejista or Ong && request.Endereco is { } e)
        {
            var endereco = usuario.Enderecos.FirstOrDefault();
            if (endereco is null) { endereco = new Endereco { UsuarioId = usuario.Id }; usuario.Enderecos.Add(endereco); }
            endereco.CEP = SomenteDigitos(e.Cep);
            endereco.Rua = e.Rua.Trim();
            endereco.Numero = e.Numero.Trim();
            endereco.Complemento = Vazio(e.Complemento);
            endereco.Bairro = e.Bairro.Trim();
            endereco.Cidade = e.Cidade.Trim();
            endereco.Estado = e.Estado.Trim().ToUpperInvariant();
        }
        await context.SaveChangesAsync();
        return Mapear(usuario);
    }

    public async Task AlterarSenhaAsync(Guid usuarioId, AlterarSenhaRequest request)
    {
        var usuario = await Carregar(usuarioId);
        var erros = new Dictionary<string, string>();
        if (string.IsNullOrEmpty(request.SenhaAtual) || !BCrypt.Net.BCrypt.Verify(request.SenhaAtual, usuario.SenhaHash))
            erros["senhaAtual"] = "A senha atual está incorreta.";
        if (!Regex.IsMatch(request.NovaSenha ?? "", RegrasSenha.Padrao))
            erros["novaSenha"] = RegrasSenha.Mensagem;
        else if (request.NovaSenha == request.SenhaAtual)
            erros["novaSenha"] = "A nova senha precisa ser diferente da atual.";
        if (erros.Count > 0) throw new ValidacaoException(erros);
        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
        await context.SaveChangesAsync();
    }

    public async Task<string> AtualizarFotoAsync(Guid usuarioId, IFormFile? foto)
    {
        if (foto is null) throw new InvalidOperationException("Envie uma imagem.");
        var usuario = await Carregar(usuarioId);
        await ImagemUploadService.ValidarAsync([foto], TamanhoMaximoFoto);
        var anterior = usuario.FotoUrl;
        usuario.FotoUrl = await uploads.SalvarAsync(foto, "contas");
        try { await context.SaveChangesAsync(); }
        catch { await uploads.RemoverAsync([usuario.FotoUrl]); throw; }
        if (anterior is not null) await uploads.RemoverAsync([anterior]);
        return usuario.FotoUrl;
    }

    private async Task<Usuario> Carregar(Guid usuarioId) =>
        await context.Usuarios.Include(u => u.Enderecos).SingleOrDefaultAsync(u => u.Id == usuarioId)
        ?? throw new KeyNotFoundException("Conta não encontrada.");

    private static void ValidarEndereco(EnderecoDto e, Dictionary<string, string> erros)
    {
        if (SomenteDigitos(e.Cep).Length != 8) erros["endereco.cep"] = "O CEP deve ter 8 dígitos.";
        if (string.IsNullOrWhiteSpace(e.Rua)) erros["endereco.rua"] = "Informe a rua.";
        if (string.IsNullOrWhiteSpace(e.Numero)) erros["endereco.numero"] = "Informe o número.";
        if (string.IsNullOrWhiteSpace(e.Bairro)) erros["endereco.bairro"] = "Informe o bairro.";
        if (string.IsNullOrWhiteSpace(e.Cidade)) erros["endereco.cidade"] = "Informe a cidade.";
        if (!Regex.IsMatch(e.Estado?.Trim() ?? "", "^[A-Za-z]{2}$")) erros["endereco.estado"] = "Use a sigla do estado (ex.: MG).";
    }

    private static ContaResponse Mapear(Usuario u)
    {
        var endereco = u.Enderecos.FirstOrDefault();
        return new ContaResponse
        {
            Id = u.Id, Tipo = u.Tipo.ToString(), Nome = u.Nome, Email = u.Email, Telefone = u.Telefone,
            FotoUrl = u.FotoUrl, StatusAprovacao = u.StatusAprovacao.ToString(), DataCriacao = u.DataCriacao,
            NomeExibicao = u switch { Varejista v => v.NomeEstabelecimento, Ong o => o.NomeFantasia, _ => u.Nome },
            Organizacao = u switch
            {
                Varejista v => new OrganizacaoDto { RazaoSocial = v.RazaoSocial, Cnpj = v.CNPJ, NomeEstabelecimento = v.NomeEstabelecimento,
                    TipoEstabelecimento = v.TipoEstabelecimento, HorarioFuncionamento = v.HorarioFuncionamento },
                Ong o => new OrganizacaoDto { Cnpj = o.CNPJ, NomeFantasia = o.NomeFantasia, AreaAtuacao = o.AreaAtuacao,
                    CapacidadeRecebimento = o.CapacidadeRecebimento, HorarioFuncionamento = o.HorarioFuncionamento },
                _ => null
            },
            Endereco = endereco is null ? null : new EnderecoDto { Cep = endereco.CEP, Rua = endereco.Rua, Numero = endereco.Numero,
                Complemento = endereco.Complemento, Bairro = endereco.Bairro, Cidade = endereco.Cidade, Estado = endereco.Estado },
            Notificacoes = new NotificacoesDto { NovasSolicitacoes = u.NotificarNovasSolicitacoes,
                Vencimentos = u.NotificarVencimentos, DoacoesConcluidas = u.NotificarDoacoesConcluidas }
        };
    }

    private static string SomenteDigitos(string? valor) => Regex.Replace(valor ?? "", @"\D", "");
    private static string? Vazio(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailValido();
}
