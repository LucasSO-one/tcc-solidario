using TccSolidario.Api.Dtos.Reserva;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Services;

public interface IReservaService
{
    Task<Transacao> ReservarAsync(Guid usuarioId, Guid produtoId);
    Task<Transacao> ValidarRetiradaAsync(Guid varejistaId, string codigo);
    Task<List<ReservaResponse>> ListarMinhasReservasAsync(Guid usuarioId);
    Task<List<ReservaResponse>> ListarValidacoesRecentesAsync(Guid varejistaId);
}