using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace TccSolidario.Api.Services.Seguranca;

public static class ConfiguracaoSeguranca
{
    public static void AdicionarSeguranca(this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        services.AddSingleton<ProtecaoSegredos>(); services.AddSingleton<EstadoOperacao>();
        services.AddSingleton<RepositorioChaves>(); services.AddSingleton<IConfigureOptions<KeyManagementOptions>, ConfigurarChaves>();
        services.AddDataProtection().SetApplicationName("VittaFlow");
        services.AddScoped<AutenticacaoService>(); services.AddScoped<LimiteAutenticacaoService>(); services.AddScoped<EmailService>();
        services.AddSingleton<SmtpEnvioEmail>(); services.AddSingleton<IEnvioEmail>(p => p.GetRequiredService<SmtpEnvioEmail>());
        if (!env.IsEnvironment("Testing"))
        {
            services.AddHostedService<EmailWorker>(); services.AddHostedService<ManutencaoSegurancaWorker>();
        }
        services.AddHttpContextAccessor();
        services.AddAntiforgery(o =>
        {
            o.HeaderName = "X-CSRF-TOKEN";
            o.Cookie.Name = env.IsProduction() ? "__Host-vittaflow-csrf" : "vittaflow-csrf";
            o.Cookie.HttpOnly = true; o.Cookie.SecurePolicy = env.IsProduction() ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
            o.Cookie.SameSite = SameSiteMode.Strict; o.Cookie.Path = "/";
        });
        services.Configure<ForwardedHeadersOptions>(o =>
        {
            o.ForwardedHeaders = ForwardedHeaders.XForwardedFor; o.ForwardLimit = 1;
            // Não confiar em cabeçalhos arbitrários. Declare apenas os proxies da implantação.
            foreach (var proxy in config.GetSection("Proxy:KnownProxies").Get<string[]>() ?? [])
                o.KnownProxies.Add(IPAddress.Parse(proxy));
            foreach (var rede in config.GetSection("Proxy:KnownNetworks").Get<string[]>() ?? [])
            {
                var partes = rede.Split('/');
                o.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse(partes[0]), int.Parse(partes[1])));
            }
        });
        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = 429;
            o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
            {
                if (!ctx.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase) || ctx.Request.Method is "GET" or "HEAD" or "OPTIONS")
                    return RateLimitPartition.GetNoLimiter("leitura");
                var identidade = ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "desconhecido";
                return RateLimitPartition.GetFixedWindowLimiter(identidade, _ => new FixedWindowRateLimiterOptions
                { PermitLimit = 120, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true });
            });
            o.OnRejected = async (c, ct) =>
            {
                c.HttpContext.Response.Headers.RetryAfter = "60";
                await c.HttpContext.Response.WriteAsJsonAsync(new { message = "Muitas solicitações. Aguarde e tente novamente." }, ct);
            };
        });
    }
    public static void Cabecalhos(HttpContext ctx, IConfiguration config, IWebHostEnvironment env)
    {
        ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
        ctx.Response.Headers["X-Frame-Options"] = "DENY";
        ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
        ctx.Response.Headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()";
        if (env.IsProduction()) ctx.Response.Headers["Strict-Transport-Security"] = "max-age=31536000";
        var csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com; "
            + "font-src 'self'; connect-src 'self' https://viacep.com.br; media-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; report-uri /api/security/csp";
        var modo = config.GetValue("Security:CspReportOnly", true) ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
        ctx.Response.Headers[modo] = csp;
        if (ctx.Request.Path.StartsWithSegments("/api")) ctx.Response.Headers.CacheControl = "no-store";
    }
}
