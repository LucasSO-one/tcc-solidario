// Middlewares/ExceptionMiddleware.cs
namespace TccSolidario.Api.Middlewares;

using TccSolidario.Api.Exceptions;
using Microsoft.EntityFrameworkCore;
using Npgsql;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DbUpdateConcurrencyException)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new { message = "O alimento foi atualizado por outra operação. Atualize a página e tente novamente." });
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new { message = "Esta operação já foi realizada. Atualize a página." });
        }
        catch (ConflictException ex)
        {
            _logger.LogWarning(ex, "Conflito de negócio");
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new { Sucesso = false, Erro = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro não tratado");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { Sucesso = false, Erro = "Erro interno no servidor." });
        }
    }
}