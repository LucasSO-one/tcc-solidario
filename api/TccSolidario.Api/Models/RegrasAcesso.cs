using TccSolidario.Api.Models.Enums;
namespace TccSolidario.Api.Models;

public static class RegrasAcesso
{
    public static bool PodeAcessar(Usuario usuario) =>
        usuario.StatusAprovacao is not (StatusAprovacao.Rejeitado or StatusAprovacao.Excluido) &&
        (usuario.Tipo is not (TipoUsuario.ONG or TipoUsuario.Varejista) ||
         usuario.StatusAprovacao == StatusAprovacao.Aprovado);
}
