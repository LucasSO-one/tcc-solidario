using Microsoft.AspNetCore.Antiforgery;

namespace TccSolidario.Api.Middlewares;

public sealed class CsrfMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IAntiforgery antiforgery)
    {
        if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase)
            && !context.Request.Path.Equals(new PathString("/api/security/csp"))
            && context.Request.Method is not ("GET" or "HEAD" or "OPTIONS"))
        {
            try { await antiforgery.ValidateRequestAsync(context); }
            catch (AntiforgeryValidationException)
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsJsonAsync(new { code = "csrf_invalid", message = "Atualize a página e tente novamente." }); return;
            }
        }
        await next(context);
    }
}
