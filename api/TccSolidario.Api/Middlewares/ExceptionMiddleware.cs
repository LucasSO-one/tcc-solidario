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
        catch (TccSolidario.Api.Services.Seguranca.LimiteExcedidoException)
        {
            context.Response.StatusCode = 429;
            context.Response.Headers.RetryAfter = "900";
            await context.Response.WriteAsJsonAsync(new { message = "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente." });
        }
        catch (DbUpdateConcurrencyException)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new { message = "Os dados foram atualizados por outra operação. Atualize a página e tente novamente." });
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new { message = "Já existe um cadastro com estes dados. Confira as informações e tente novamente." });
        }
        catch (TccSolidario.Api.Exceptions.ValidacaoException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { message = ex.Message, erros = ex.Erros });
        }
        catch (ConflictException ex)
        {
            _logger.LogWarning(ex, "Conflito de negócio");
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new { Sucesso = false, Erro = ex.Message });
        }
        catch (BadHttpRequestException ex)
        {
            context.Response.StatusCode = ex.StatusCode;
            await context.Response.WriteAsJsonAsync(new { message = "Solicitação inválida ou maior que o limite permitido." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro não tratado");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { Sucesso = false, Erro = "Erro interno no servidor." });
        }
    }
}