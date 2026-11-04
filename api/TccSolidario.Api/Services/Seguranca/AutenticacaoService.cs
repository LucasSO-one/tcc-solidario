using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Services.Seguranca;

public record ResultadoAutenticacao(Usuario? Usuario = null, string? Jwt = null, string? Desafio = null,
    bool ConfigurarMfa = false, string? Segredo = null, string? UriAutenticador = null,
    string[]? CodigosRecuperacao = null, string? Erro = null);

public sealed class AutenticacaoService(AppDbContext db, ProtecaoSegredos protecao, EmailService emails,
    LimiteAutenticacaoService limites, ITokenService tokens, TimeProvider clock)
{
    private static readonly string HashFicticio = BCrypt.Net.BCrypt.HashPassword(ProtecaoSegredos.NovoToken(), 12);
    private DateTime Agora => clock.GetUtcNow().UtcDateTime;
    private static bool ConferirSenha(string senha, string hash)
    {
        if (string.IsNullOrEmpty(senha) || Encoding.UTF8.GetByteCount(senha) > 72) return false;
        try { return BCrypt.Net.BCrypt.Verify(senha, hash); }
        catch (BCrypt.Net.SaltParseException) { return false; }
        catch (ArgumentException) { return false; }
    }
    public async Task<ResultadoAutenticacao> LoginAsync(string email, string senha)
    {
        var normalizado = EmailNormalizado.Normalizar(email);
        await limites.ExigirAsync("login", normalizado, 8, TimeSpan.FromMinutes(15));
        await using var operacao = await OperacaoConta.IniciarAsync(db);
        var usuario = await db.Usuarios.SingleOrDefaultAsync(u => u.EmailNormalizado == normalizado);
        var correta = ConferirSenha(senha, usuario?.SenhaHash ?? HashFicticio);
        ResultadoAutenticacao resultado;
        if (usuario is null || !correta || !RegrasAcesso.PodeAcessar(usuario))
        {
            db.EventosAuditoria.Add(new() { UsuarioId = usuario?.Id, Acao = "auth.login", Sucesso = false, EmUtc = Agora });
            resultado = new(Erro: "Credenciais inválidas ou cadastro sem autorização para acesso.");
        }
        else if (!usuario.EmailConfirmado) resultado = new(Erro: "Confirme seu e-mail para entrar. Você pode solicitar outro link.");
        else if (usuario.Tipo == TipoUsuario.Admin || usuario.MfaAtivo)
            resultado = await PrepararMfaAsync(usuario, !usuario.MfaAtivo);
        else resultado = CriarSessao(usuario);
        await db.SaveChangesAsync(); await operacao.CommitAsync(); return resultado;
    }
    private ResultadoAutenticacao CriarSessao(Usuario usuario, string[]? codigos = null)
    {
        var sessao = new SessaoAutenticacao { UsuarioId = usuario.Id, VersaoUsuario = usuario.VersaoSeguranca, CriadaEmUtc = Agora, ExpiraEmUtc = Agora.AddHours(8) };
        db.SessoesAutenticacao.Add(sessao);
        db.EventosAuditoria.Add(new() { UsuarioId = usuario.Id, Acao = "auth.login", EmUtc = Agora });
        return new(usuario, tokens.GerarTokenJwt(usuario, sessao.Id), CodigosRecuperacao: codigos);
    }
    private async Task<ResultadoAutenticacao> PrepararMfaAsync(Usuario usuario, bool configurar)
    {
        await db.TokensSeguranca.Where(t => t.UsuarioId == usuario.Id && t.Finalidade.StartsWith("mfa") && t.ConsumidoEmUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.ConsumidoEmUtc, Agora));
        var chave = ProtecaoSegredos.NovoToken();
        var segredo = configurar ? Totp.NovoSegredo() : null;
        db.TokensSeguranca.Add(new() { Hash = ProtecaoSegredos.Hash(chave), UsuarioId = usuario.Id, VersaoUsuario = usuario.VersaoSeguranca,
            Finalidade = configurar ? "mfa-setup" : "mfa-login", ExpiraEmUtc = Agora.AddMinutes(5),
            SegredoProtegido = segredo is null ? null : protecao.Proteger(segredo, "mfa:" + usuario.Id) });
        var uri = segredo is null ? null : "otpauth://totp/" + Uri.EscapeDataString("VittaFlow:" + usuario.Email)
            + "?secret=" + segredo + "&issuer=VittaFlow&algorithm=SHA1&digits=6&period=30";
        return new(Desafio: chave, ConfigurarMfa: configurar, Segredo: segredo, UriAutenticador: uri);
    }
    public async Task<ResultadoAutenticacao> ConfirmarMfaAsync(string desafio, string codigo, string? recuperacao)
    {
        await limites.ExigirAsync("mfa", ProtecaoSegredos.Hash(desafio), 8, TimeSpan.FromMinutes(5));
        await using var operacao = await OperacaoConta.IniciarAsync(db);
        var hash = ProtecaoSegredos.Hash(desafio);
        var t = await db.TokensSeguranca.SingleOrDefaultAsync(t => t.Hash == hash && t.ConsumidoEmUtc == null);
        var usuario = t is null ? null : await db.Usuarios.SingleOrDefaultAsync(u => u.Id == t.UsuarioId);
        if (t is null || usuario is null || !t.Finalidade.StartsWith("mfa") || t.ExpiraEmUtc <= Agora || t.Falhas >= 5
            || t.VersaoUsuario != usuario.VersaoSeguranca || !RegrasAcesso.PodeAcessar(usuario) || !usuario.EmailConfirmado)
            return new(Erro: "Desafio inválido ou expirado. Entre novamente.");
        var setup = t.Finalidade == "mfa-setup";
        var segredo = protecao.Desproteger(setup ? t.SegredoProtegido! : usuario.SegredoMfaProtegido!, "mfa:" + usuario.Id);
        var passo = Totp.Validar(segredo, codigo, clock.GetUtcNow(), setup ? -1 : usuario.UltimoPassoMfa);
        var hashes = JsonSerializer.Deserialize<List<string>>(usuario.CodigosRecuperacaoMfa) ?? [];
        var hashRecuperacao = ProtecaoSegredos.Hash((recuperacao ?? "").Replace("-", "").Trim().ToUpperInvariant());
        var indice = hashes.FindIndex(h => CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(h), Encoding.ASCII.GetBytes(hashRecuperacao)));
        if (!setup && !string.IsNullOrWhiteSpace(recuperacao) && indice >= 0)
        {
            t.ConsumidoEmUtc = Agora; hashes.RemoveAt(indice); usuario.CodigosRecuperacaoMfa = JsonSerializer.Serialize(hashes);
            // A recuperação exige cadastrar novo autenticador antes de conceder sessão completa.
            await db.SaveChangesAsync(); var renovar = await PrepararMfaAsync(usuario, true);
            db.EventosAuditoria.Add(new() { UsuarioId = usuario.Id, Acao = "auth.mfa.recuperacao", EmUtc = Agora });
            await db.SaveChangesAsync(); await operacao.CommitAsync(); return renovar;
        }
        if (passo is null)
        {
            t.Falhas++; await db.SaveChangesAsync(); await operacao.CommitAsync();
            return new(Erro: "Código inválido ou já utilizado. Aguarde o próximo código do aplicativo.");
        }
        t.ConsumidoEmUtc = Agora; usuario.UltimoPassoMfa = passo.Value;
        string[]? novosCodigos = null;
        if (setup)
        {
            usuario.MfaAtivo = true; usuario.SegredoMfaProtegido = t.SegredoProtegido; t.SegredoProtegido = null;
            novosCodigos = Enumerable.Range(0, 10).Select(_ => Convert.ToHexString(RandomNumberGenerator.GetBytes(10))).ToArray();
            usuario.CodigosRecuperacaoMfa = JsonSerializer.Serialize(novosCodigos.Select(ProtecaoSegredos.Hash));
            usuario.VersaoSeguranca = Guid.NewGuid();
            db.EventosAuditoria.Add(new() { UsuarioId = usuario.Id, Acao = "auth.mfa.configurado", EmUtc = Agora });
        }
        var resultado = CriarSessao(usuario, novosCodigos);
        await db.SaveChangesAsync(); await operacao.CommitAsync(); return resultado;
    }
    public async Task EnfileirarConfirmacaoAsync(Guid id)
    {
        var usuario = await db.Usuarios.SingleAsync(u => u.Id == id);
        if (!usuario.EmailConfirmado) await CriarLinkAsync(usuario, "confirmar-email", TimeSpan.FromHours(24));
    }
    public async Task SolicitarLinkAsync(string email, bool confirmar)
    {
        var normalizado = EmailNormalizado.Normalizar(email);
        await limites.ExigirAsync(confirmar ? "reenviar" : "recuperar", normalizado, 3, TimeSpan.FromMinutes(15));
        await using var operacao = await OperacaoConta.IniciarAsync(db);
        var usuario = await db.Usuarios.SingleOrDefaultAsync(u => u.EmailNormalizado == normalizado && u.StatusAprovacao != StatusAprovacao.Excluido);
        if (usuario is not null && (!confirmar || !usuario.EmailConfirmado))
            await CriarLinkAsync(usuario, confirmar ? "confirmar-email" : "redefinir-senha", confirmar ? TimeSpan.FromHours(24) : TimeSpan.FromMinutes(30));
        await operacao.CommitAsync();
    }
    private async Task CriarLinkAsync(Usuario usuario, string finalidade, TimeSpan prazo)
    {
        await db.TokensSeguranca.Where(t => t.UsuarioId == usuario.Id && t.Finalidade == finalidade && t.ConsumidoEmUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.ConsumidoEmUtc, Agora));
        var valor = ProtecaoSegredos.NovoToken(); var expira = Agora.Add(prazo);
        db.TokensSeguranca.Add(new() { Hash = ProtecaoSegredos.Hash(valor), UsuarioId = usuario.Id, VersaoUsuario = usuario.VersaoSeguranca, Finalidade = finalidade, ExpiraEmUtc = expira });
        emails.Enfileirar(usuario, finalidade, valor, expira); await db.SaveChangesAsync();
    }
    public async Task<bool> ConsumirLinkAsync(string valor, string? novaSenha)
    {
        var finalidade = novaSenha is null ? "confirmar-email" : "redefinir-senha";
        if (novaSenha is not null && !EmailNormalizado.SenhaValida(novaSenha)) return false;
        await using var operacao = await OperacaoConta.IniciarAsync(db);
        var hash = ProtecaoSegredos.Hash(valor);
        var t = await db.TokensSeguranca.SingleOrDefaultAsync(t => t.Hash == hash && t.Finalidade == finalidade && t.ConsumidoEmUtc == null);
        if (t is null || t.ExpiraEmUtc <= Agora) return false;
        var usuario = await db.Usuarios.SingleOrDefaultAsync(u => u.Id == t.UsuarioId);
        if (usuario is null || usuario.StatusAprovacao == StatusAprovacao.Excluido || usuario.VersaoSeguranca != t.VersaoUsuario) return false;
        t.ConsumidoEmUtc = Agora;
        if (novaSenha is null) usuario.EmailConfirmado = true;
        else
        {
            usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(novaSenha, 12); usuario.VersaoSeguranca = Guid.NewGuid();
            await db.SessoesAutenticacao.Where(s => s.UsuarioId == usuario.Id && s.RevogadaEmUtc == null).ExecuteUpdateAsync(s => s.SetProperty(t => t.RevogadaEmUtc, Agora));
        }
        db.EventosAuditoria.Add(new() { UsuarioId = usuario.Id, Acao = "auth." + finalidade, EmUtc = Agora });
        await db.SaveChangesAsync(); await operacao.CommitAsync(); return true;
    }
}
