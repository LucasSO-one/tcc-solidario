// Services/IUsuarioRegistrationService.cs
namespace TccSolidario.Api.Services;

using TccSolidario.Api.Models;

public interface IUsuarioRegistrationService
{
    Task<TUsuario> RegistrarAsync<TUsuario>(TUsuario usuario, string senhaPura) where TUsuario : Usuario;
}