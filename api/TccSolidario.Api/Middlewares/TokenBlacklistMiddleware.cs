using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using TccSolidario.Api.Services.Auth;

namespace TccSolidario.Api.Middlewares;

public class TokenBlacklistMiddleware
{
    private readonly RequestDelegate _next;

    public TokenBlacklistMiddleware(RequestDelegate next)
    {
        _next = next; // _next representa o próximo passo no pipeline (o Controller)
    }

    // O .NET injeta o ILogoutService automaticamente aqui a cada requisição
    public async Task InvokeAsync(HttpContext context, ILogoutService logoutService)
    {
        // 1. Verifica se a requisição trouxe um token no cabeçalho
        var authHeader = context.Request.Headers["Authorization"].ToString();

        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
        {
            var token = authHeader.Replace("Bearer ", "").Trim();

            // 2. Pergunta ao nosso serviço se esse token está na lista negra
            if (logoutService.IsTokenInvalido(token))
            {
                // 3. Se estiver, bloqueia a passagem e devolve erro 401
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                
                await context.Response.WriteAsJsonAsync(new 
                { 
                    Sucesso = false, 
                    Erro = "Sessão encerrada. Faça login novamente." 
                });
                
                return; // O 'return' encerra a requisição aqui, sem chamar o _next
            }
        }

        // 4. Se o token não estiver banido (ou se for uma rota pública sem token), deixa passar
        await _next(context);
    }
}