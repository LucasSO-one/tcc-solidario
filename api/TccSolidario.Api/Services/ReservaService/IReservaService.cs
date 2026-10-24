using TccSolidario.Api.Dtos.Reserva;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Services;

public interface IReservaService
{
    Task<Transacao> ReservarAsync(Guid usuarioId, Guid produtoId);
    Task<Transacao> ValidarRetiradaAsync(Guid varejistaId, string codigo);
    Task CancelarAsync(Guid usuarioId, Guid reservaId);
    Task<List<ReservaResponse>> ListarMinhasReservasAsync(Guid usuarioId);
    Task<List<ReservaResponse>> ListarValidacoesRecentesAsync(Guid varejistaId);
    Task<List<ReservaResponse>> ListarReservasPendentesAsync(Guid varejistaId);
}