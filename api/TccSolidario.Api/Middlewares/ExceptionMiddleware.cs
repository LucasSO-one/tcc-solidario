// Middlewares/ExceptionMiddleware.cs
namespace TccSolidario.Api.Middlewares;

using TccSolidario.Api.Exceptions;

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