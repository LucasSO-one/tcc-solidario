using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Dtos.Produto;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
using VittaFlow.Api.DTOs;

namespace TccSolidario.Api.Services;

public class ProdutoService : IProdutoService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ProdutoService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<Produto> CadastrarLoteAsync(Guid varejistaId, CadastrarLoteRequest request)
    {
        var varejistaExiste = await _context.Varejistas.AnyAsync(v => v.Id == varejistaId);
        if (!varejistaExiste)
            throw new InvalidOperationException("Varejista não encontrado.");

        string? imagemUrl = request.Imagem is { Length: > 0 }
            ? await SalvarImagemAsync(request.Imagem)
            : null;

        var produto = new Produto
        {
            Titulo = request.Nome,
            Categoria = request.Categoria,
            Descricao = request.Descricao ?? string.Empty,
            Quantidade = request.Quantidade,
            DataValidade = request.DataValidade,
            PrecoOriginal = request.PrecoOriginal,
            PrecoVenda = request.PrecoDesconto,
            IsOferta = request.IsOferta,
            FrutaFeia = request.FrutaFeia,
            ImagemUrl = imagemUrl,
            VarejistaId = varejistaId,
            Status = request.PrecoDesconto.HasValue
                ? StatusProduto.EmDesconto
                : StatusProduto.Disponivel,
        };

        _context.Produtos.Add(produto);
        await _context.SaveChangesAsync();

        return produto;
    }

    private async Task<string> SalvarImagemAsync(IFormFile imagem)
    {
        var webRootPath = _env.WebRootPath
            ?? Path.Combine(_env.ContentRootPath, "wwwroot");

        var pasta = Path.Combine(webRootPath, "uploads", "produtos");
        Directory.CreateDirectory(pasta); // cria toda a cadeia de pastas se não existir, incluindo wwwroot

        var nomeArquivo = $"{Guid.NewGuid()}{Path.GetExtension(imagem.FileName)}";
        var caminho = Path.Combine(pasta, nomeArquivo);

        await using var stream = new FileStream(caminho, FileMode.Create);
        await imagem.CopyToAsync(stream);

        return $"/uploads/produtos/{nomeArquivo}";
    }

    public async Task<List<ProdutoResumoResponse>> ListarPorVarejistaAsync(Guid varejistaId)
    {
        return await _context.Produtos
            .Where(p => p.VarejistaId == varejistaId)
            .OrderByDescending(p => p.DataValidade)
            .Select(p => new ProdutoResumoResponse
            {
                Id = p.Id,
                Titulo = p.Titulo,
                Categoria = p.Categoria,
                Quantidade = p.Quantidade,
                DataValidade = p.DataValidade,
                Status = p.Status.ToString(),
                ImagemUrl = p.ImagemUrl,
            })
            .ToListAsync();
    }
    public async Task<List<ProdutoVitrineResponse>> ListarVitrineAsync(
        string? busca,
        bool apenasFrutasFeias)
    {
        var statusVisiveis = new[]
        {
        StatusProduto.Disponivel,
        StatusProduto.EmDesconto,
        StatusProduto.DisponivelParaDoacao
    };

        var query = _context.Produtos
            .Include(p => p.Varejista)
            .Where(p => statusVisiveis.Contains(p.Status));

        if (apenasFrutasFeias)
            query = query.Where(p => p.FrutaFeia);

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim().ToLower();

            query = query.Where(p =>
                p.Titulo.ToLower().Contains(termo) ||
                p.Varejista.NomeEstabelecimento.ToLower().Contains(termo));
        }

        var produtos = await query
            .OrderBy(p => p.DataValidade)
            .ToListAsync();

        return produtos.Select(MapParaVitrine).ToList();
    }

    public async Task<List<ProdutoVitrineResponse>> ListarOfertasAsync(string? busca)
    {
        var statusVisiveis = new[]
        {
        StatusProduto.Disponivel,
        StatusProduto.EmDesconto,
        StatusProduto.DisponivelParaDoacao
    };

        var query = _context.Produtos
            .Include(p => p.Varejista)
            .Where(p =>
                (p.IsOferta ?? false) &&
                statusVisiveis.Contains(p.Status));

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim().ToLower();

            query = query.Where(p =>
                p.Titulo.ToLower().Contains(termo) ||
                p.Varejista.NomeEstabelecimento.ToLower().Contains(termo));
        }

        var produtos = await query
            .OrderBy(p => p.DataValidade)
            .ToListAsync();

        return produtos.Select(MapParaVitrine).ToList();
    }

    private static ProdutoVitrineResponse MapParaVitrine(Produto p)
    {
        var diasRestantes = (int)Math.Ceiling((p.DataValidade - DateTime.Now).TotalDays);

        decimal? percentual = p.PrecoVenda.HasValue && p.PrecoOriginal > 0
            ? Math.Round((1 - (p.PrecoVenda.Value / p.PrecoOriginal)) * 100, 0)
            : null;

        return new ProdutoVitrineResponse
        {
            Id = p.Id,
            Nome = p.Titulo,
            Categoria = p.Categoria,
            ImagemUrl = p.ImagemUrl,
            NomeVarejista = p.Varejista?.NomeEstabelecimento ?? "Estabelecimento",
            PrecoOriginal = p.PrecoOriginal,
            PrecoDesconto = p.PrecoVenda,
            DescontoPercentual = percentual,
            DiasRestantes = Math.Max(diasRestantes, 0),
            FrutaFeia = p.FrutaFeia,
            Status = p.Status.ToString(),
        };
    }


}