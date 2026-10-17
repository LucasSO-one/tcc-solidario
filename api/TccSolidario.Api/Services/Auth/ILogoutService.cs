namespace TccSolidario.Api.Services.Auth;

public interface ILogoutService
{
    void InvalidarToken(string token);
    bool IsTokenInvalido(string token);
}