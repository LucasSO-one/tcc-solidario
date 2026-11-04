using System.Collections.Concurrent;

namespace TccSolidario.Api.Services.Seguranca;

public sealed class EstadoOperacao
{
    private readonly ConcurrentDictionary<string, (DateTime? Sucesso, DateTime? Falha)> estados = new();
    public void Sucesso(string nome) => estados.AddOrUpdate(nome, (DateTime.UtcNow, null), (_, atual) => (DateTime.UtcNow, atual.Falha));
    public void Falha(string nome) => estados.AddOrUpdate(nome, (null, DateTime.UtcNow), (_, atual) => (atual.Sucesso, DateTime.UtcNow));
    public object Snapshot() => estados.ToDictionary(e => e.Key, e => new { ultimoSucessoUtc = e.Value.Sucesso, ultimaFalhaUtc = e.Value.Falha, saudavel = e.Value.Sucesso.HasValue && (!e.Value.Falha.HasValue || e.Value.Sucesso > e.Value.Falha) });
    public bool Saudavel => estados.All(e => e.Value.Sucesso.HasValue && (!e.Value.Falha.HasValue || e.Value.Sucesso > e.Value.Falha));
}
