// Services/ITokenService.cs
namespace TccSolidario.Api.Services;

using TccSolidario.Api.Models;

public interface ITokenService
{
    string GerarTokenJwt(Usuario usuario);
}