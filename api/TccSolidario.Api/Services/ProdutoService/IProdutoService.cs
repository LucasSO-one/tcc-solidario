using TccSolidario.Api.Dtos.Produto;
using TccSolidario.Api.Models;
using VittaFlow.Api.DTOs;

namespace TccSolidario.Api.Services;

public interface IProdutoService
{
    Task<Produto> CadastrarLoteAsync(Guid varejistaId, CadastrarLoteRequest request);
    Task<List<ProdutoResumoResponse>> ListarPorVarejistaAsync(Guid varejistaId);
    Task<List<ProdutoVitrineResponse>> ListarVitrineAsync(string? busca, bool apenasFrutasFeias);
    Task<List<ProdutoVitrineResponse>> ListarOfertasAsync(string? busca);

    
}