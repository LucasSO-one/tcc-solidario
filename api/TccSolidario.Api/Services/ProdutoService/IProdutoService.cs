using TccSolidario.Api.Dtos.Produto;
using TccSolidario.Api.Models;
using VittaFlow.Api.DTOs;

namespace TccSolidario.Api.Services;

public interface IProdutoService
{
    Task<Produto> CadastrarLoteAsync(Guid varejistaId, CadastrarLoteRequest request);
    Task<List<ProdutoResumoResponse>> ListarPorVarejistaAsync(Guid varejistaId);
    Task<ProdutoResumoResponse> ObterDoVarejistaAsync(Guid varejistaId, Guid produtoId);
    Task AtualizarAsync(Guid varejistaId, Guid produtoId, AtualizarProdutoRequest request);
    Task ExcluirAsync(Guid varejistaId, Guid produtoId);
    Task<List<ProdutoVitrineResponse>> ListarVitrineAsync(string? busca, bool apenasFrutasFeias);
    Task<List<ProdutoVitrineResponse>> ListarOfertasAsync(string? busca);
    Task<List<ProdutoVitrineResponse>> ListarDoacoesAsync(string? busca, bool apenasFrutasFeias = false);
    Task AnteciparDoacaoAsync(Guid varejistaId, Guid produtoId);
    Task VerificarValidadesAsync();    
}