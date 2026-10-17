using Microsoft.Extensions.Caching.Memory;
using System;
using System.IdentityModel.Tokens.Jwt;

namespace TccSolidario.Api.Services.Auth;

public class LogoutService : ILogoutService
{
    private readonly IMemoryCache _cache;

    public LogoutService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public void InvalidarToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        if (handler.CanReadToken(token))
        {
            var jwtToken = handler.ReadJwtToken(token);
            var dataExpiracao = jwtToken.ValidTo;
            var tempoRestante = dataExpiracao - DateTime.UtcNow;

            if (tempoRestante > TimeSpan.Zero)
            {
                // Guarda o token na memória apenas pelo tempo que falta para expirar
                _cache.Set(token, true, tempoRestante);
            }
        }
    }

    public bool IsTokenInvalido(string token)
    {
        return _cache.TryGetValue(token, out _);
    }
}