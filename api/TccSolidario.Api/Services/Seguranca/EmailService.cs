using System.Net;
using System.Net.Mail;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Services.Seguranca;

public record MensagemEmail(string Destino, string Assunto, string Corpo);
public interface IEnvioEmail { Task EnviarAsync(MensagemEmail mensagem, CancellationToken ct); }

public sealed class SmtpEnvioEmail(IConfiguration config, IWebHostEnvironment env) : IEnvioEmail
{
    public void ValidarConfiguracao()
    {
        if (!env.IsProduction()) return;
        if (string.IsNullOrWhiteSpace(config["Email:SmtpHost"]) || !EmailNormalizado.Valido(config["Email:Remetente"] ?? "")
            || !config.GetValue("Email:StartTls", true))
            throw new InvalidOperationException("Configure Email__SmtpHost, Email__Remetente e STARTTLS para confirmação e recuperação de contas.");
    }
    public async Task EnviarAsync(MensagemEmail mensagem, CancellationToken ct)
    {
        using var smtp = new SmtpClient(config["Email:SmtpHost"] ?? "localhost", config.GetValue("Email:SmtpPort", 587))
        {
            EnableSsl = config.GetValue("Email:StartTls", true), UseDefaultCredentials = false,
            Credentials = string.IsNullOrWhiteSpace(config["Email:Usuario"]) ? null : new NetworkCredential(config["Email:Usuario"], config["Email:Senha"]),
            Timeout = 20000
        };
        using var mail = new MailMessage(new MailAddress(config["Email:Remetente"] ?? "teste@example.invalid", "VittaFlow"), new MailAddress(mensagem.Destino))
        { Subject = mensagem.Assunto, Body = mensagem.Corpo, IsBodyHtml = false };
        await smtp.SendMailAsync(mail, ct);
    }
}

public sealed class EmailService(AppDbContext db, ProtecaoSegredos protecao, IConfiguration config, IWebHostEnvironment env, TimeProvider clock)
{
    public string OrigemPublica()
    {
        var origem = config["Security:PublicOrigin"];
        if (string.IsNullOrWhiteSpace(origem) && !string.IsNullOrWhiteSpace(config["RAILWAY_PUBLIC_DOMAIN"])) origem = "https://" + config["RAILWAY_PUBLIC_DOMAIN"];
        origem ??= env.IsProduction() ? "" : "http://localhost:5173";
        if (!Uri.TryCreate(origem, UriKind.Absolute, out var uri) || (env.IsProduction() && uri.Scheme != "https")
            || uri.UserInfo.Length > 0 || uri.Query.Length > 0 || uri.Fragment.Length > 0 || uri.AbsolutePath != "/")
            throw new InvalidOperationException("Configure Security__PublicOrigin com a origem HTTPS pública, sem caminho, credenciais ou parâmetros.");
        return origem.TrimEnd('/');
    }
    public void Enfileirar(Usuario usuario, string finalidade, string token, DateTime expira)
    {
        var fila = new EmailPendente { UsuarioId = usuario.Id, CriadoEmUtc = clock.GetUtcNow().UtcDateTime, ProximaTentativaUtc = clock.GetUtcNow().UtcDateTime, ExpiraEmUtc = expira };
        var rota = finalidade == "confirmar-email" ? "/confirmar-email" : "/redefinir-senha";
        var assunto = finalidade == "confirmar-email" ? "Confirme seu e-mail na VittaFlow" : "Redefina sua senha na VittaFlow";
        var link = OrigemPublica() + rota + "#token=" + Uri.EscapeDataString(token);
        var mensagem = new MensagemEmail(usuario.Email, assunto, $"{assunto}.\n\nAbra o endereço:\n{link}\n\nEste link é de uso único e expira em {expira:dd/MM/yyyy HH:mm} UTC.\nSe você não solicitou esta ação, ignore esta mensagem.\nVittaFlow");
        fila.MensagemProtegida = protecao.Proteger(JsonSerializer.Serialize(mensagem), "email:" + fila.Id);
        db.EmailsPendentes.Add(fila);
    }
}

public sealed class EmailWorker(IServiceScopeFactory scopes, ILogger<EmailWorker> logger, EstadoOperacao estado, IConfiguration config) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(Math.Clamp(config.GetValue("Email:PollSeconds", 15), 1, 300)));
        do
        {
            try
            {
                using var scope = scopes.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var clock = scope.ServiceProvider.GetRequiredService<TimeProvider>(); var agora = clock.GetUtcNow().UtcDateTime;
                var ids = await db.EmailsPendentes.AsNoTracking().Where(e => !e.Cancelado && e.EnviadoEmUtc == null && e.Tentativas < 5 && e.ExpiraEmUtc > agora && e.ProximaTentativaUtc <= agora
                    && (e.EmProcessamentoAteUtc == null || e.EmProcessamentoAteUtc < agora)).OrderBy(e => e.CriadoEmUtc).Select(e => e.Id).Take(10).ToListAsync(ct);
                foreach (var id in ids)
                {
                    var claimed = await db.EmailsPendentes.Where(e => e.Id == id && !e.Cancelado && e.EnviadoEmUtc == null && (e.EmProcessamentoAteUtc == null || e.EmProcessamentoAteUtc < agora))
                        .ExecuteUpdateAsync(s => s.SetProperty(e => e.EmProcessamentoAteUtc, agora.AddMinutes(2)).SetProperty(e => e.Tentativas, e => e.Tentativas + 1), ct);
                    if (claimed == 0) continue;
                    var item = await db.EmailsPendentes.SingleAsync(e => e.Id == id, ct);
                    try
                    {
                        var protecao = scope.ServiceProvider.GetRequiredService<ProtecaoSegredos>();
                        var mensagem = JsonSerializer.Deserialize<MensagemEmail>(protecao.Desproteger(item.MensagemProtegida, "email:" + item.Id))!;
                        await scope.ServiceProvider.GetRequiredService<IEnvioEmail>().EnviarAsync(mensagem, ct);
                        item.EnviadoEmUtc = clock.GetUtcNow().UtcDateTime; item.MensagemProtegida = "";
                    }
                    catch (Exception ex) when (!ct.IsCancellationRequested)
                    {
                        item.ProximaTentativaUtc = agora.AddMinutes(Math.Pow(2, item.Tentativas - 1));
                        // Não registrar destinatário, corpo, link, senha SMTP ou a mensagem bruta da exceção.
                        logger.LogWarning("Falha no envio de e-mail {Id}; tentativa {Tentativa}; tipo {Tipo}.", id, item.Tentativas, ex.GetType().Name);
                    }
                    item.EmProcessamentoAteUtc = null; await db.SaveChangesAsync(ct);
                }
                estado.Sucesso("email");
            }
            catch (Exception ex) when (!ct.IsCancellationRequested) { estado.Falha("email"); logger.LogError("Falha no processamento da fila de e-mail: {Tipo}.", ex.GetType().Name); }
            try { if (!await timer.WaitForNextTickAsync(ct)) break; } catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
        } while (!ct.IsCancellationRequested);
    }
}
