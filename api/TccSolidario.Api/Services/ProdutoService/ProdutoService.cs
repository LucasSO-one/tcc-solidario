using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Dtos.Produto;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
using VittaFlow.Api.DTOs;

namespace TccSolidario.Api.Services;

public class ProdutoService(AppDbContext context, ImagemUploadService uploads, CicloVidaService ciclo, TimeProvider clock) : IProdutoService
{
    public async Task<Produto> CadastrarLoteAsync(Guid varejistaId, CadastrarLoteRequest request)
    {
        var varejista = await context.Varejistas.SingleOrDefaultAsync(v => v.Id == varejistaId);
        if (varejista is null || !RegrasAcesso.PodeAcessar(varejista))
            throw new InvalidOperationException("Varejista não aprovado.");
        var agora = clock.GetUtcNow().UtcDateTime;
        var validade = ValidarDados(request.Nome, request.Quantidade, request.DataValidade,
            request.PrecoOriginal, request.PrecoDesconto, agora);
        var imagens = request.Imagens.ToList();
        if (request.Imagem is { Length: > 0 }) imagens.Insert(0, request.Imagem);
        await ImagemUploadService.ValidarAsync(imagens);
        if (imagens.Count > 0 && (request.IndiceCapa < 0 || request.IndiceCapa >= imagens.Count))
            throw new InvalidOperationException("A foto de capa escolhida não foi enviada.");
        if (imagens.Count > 0)
        {
            // A capa vai para a primeira posição; as demais mantêm a ordem escolhida.
            var capa = imagens[request.IndiceCapa];
            imagens.RemoveAt(request.IndiceCapa);
            imagens.Insert(0, capa);
        }
        var produto = new Produto
        {
            Titulo = request.Nome.Trim(), Categoria = request.Categoria,
            Descricao = request.Descricao ?? "", Quantidade = request.Quantidade,
            DataValidade = validade, PrecoOriginal = request.PrecoOriginal,
            PrecoVenda = request.PrecoDesconto, IsOferta = request.IsOferta,
            FrutaFeia = request.FrutaFeia, VarejistaId = varejistaId,
            Status = request.PrecoDesconto.HasValue ? StatusProduto.EmDesconto : StatusProduto.Disponivel
        };
        var urls = new List<string>();
        try
        {
            foreach (var imagem in imagens) urls.Add(await uploads.SalvarAsync(imagem, "produtos"));
            produto.Imagens = urls.Select((url, ordem) => new ProdutoImagem { Url = url, Ordem = ordem }).ToList();
            produto.ImagemUrl = urls.FirstOrDefault();
            RegrasCicloVida.AtualizarProduto(produto, agora);
            context.Produtos.Add(produto);
            await context.SaveChangesAsync();
        }
        catch
        {
            await uploads.RemoverAsync(urls); // não deixa arquivos órfãos se o cadastro falhar
            throw;
        }
        return produto;
    }

    public async Task<List<ProdutoResumoResponse>> ListarPorVarejistaAsync(Guid varejistaId)
    {
        await ciclo.AtualizarAsync();
        return await context.Produtos.AsNoTracking().Where(p => p.VarejistaId == varejistaId)
            .OrderBy(p => p.DataValidade).Select(ParaResumo).ToListAsync();
    }

    public async Task<ProdutoResumoResponse> ObterDoVarejistaAsync(Guid varejistaId, Guid produtoId)
    {
        await ciclo.AtualizarAsync();
        return await context.Produtos.AsNoTracking().Where(p => p.Id == produtoId && p.VarejistaId == varejistaId)
            .Select(ParaResumo).SingleOrDefaultAsync()
            ?? throw new InvalidOperationException("Alimento não encontrado neste estabelecimento.");
    }

    public async Task AtualizarAsync(Guid varejistaId, Guid produtoId, AtualizarProdutoRequest request)
    {
        await ciclo.AtualizarAsync();
        var produto = await context.Produtos.Include(p => p.Imagens)
            .SingleOrDefaultAsync(p => p.Id == produtoId && p.VarejistaId == varejistaId)
            ?? throw new InvalidOperationException("Alimento não encontrado neste estabelecimento.");
        if (!RegrasCicloVida.Editavel(produto))
            throw new InvalidOperationException("Somente alimentos à venda ou disponíveis para doação podem ser editados.");
        var agora = clock.GetUtcNow().UtcDateTime;
        var validade = ValidarDados(request.Nome, request.Quantidade, request.DataValidade,
            request.PrecoOriginal, request.PrecoDesconto, agora);

        // Lista final de fotos: atuais mantidas e novas, na ordem enviada (a primeira é a capa).
        var atuais = produto.Imagens.Select(i => i.Url).ToHashSet();
        if (request.Fotos.Count != request.Fotos.Distinct().Count())
            throw new InvalidOperationException("A lista de fotos tem itens repetidos.");
        if (request.Fotos.Count > ImagemUploadService.MaxImagens)
            throw new InvalidOperationException($"Envie no máximo {ImagemUploadService.MaxImagens} fotos por alimento.");
        var ordem = new List<(string? Url, IFormFile? Arquivo)>();
        foreach (var foto in request.Fotos)
        {
            if (foto.StartsWith("nova:") && int.TryParse(foto[5..], out var indice) && indice >= 0 && indice < request.NovasImagens.Count)
                ordem.Add((null, request.NovasImagens[indice]));
            else if (atuais.Contains(foto))
                ordem.Add((foto, null));
            else
                throw new InvalidOperationException("Uma das fotos enviadas não pertence a este alimento.");
        }
        await ImagemUploadService.ValidarAsync(ordem.Where(f => f.Arquivo is not null).Select(f => f.Arquivo!).ToList());

        produto.Titulo = request.Nome.Trim();
        produto.Categoria = request.Categoria;
        produto.Descricao = request.Descricao ?? "";
        produto.Quantidade = request.Quantidade;
        produto.DataValidade = validade;
        produto.PrecoOriginal = request.PrecoOriginal;
        produto.FrutaFeia = request.FrutaFeia;
        // Na doação o preço segue zerado e sem destaque; à venda, o status acompanha o desconto.
        if (RegrasCicloVida.Comercial(produto))
        {
            produto.PrecoVenda = request.PrecoDesconto;
            produto.IsOferta = request.IsOferta;
            produto.Status = request.PrecoDesconto.HasValue ? StatusProduto.EmDesconto : StatusProduto.Disponivel;
            RegrasCicloVida.AtualizarProduto(produto, agora);
        }

        var enviadas = new List<string>();
        try
        {
            var urls = new List<string>();
            foreach (var (url, arquivo) in ordem)
            {
                if (arquivo is null) { urls.Add(url!); continue; }
                var nova = await uploads.SalvarAsync(arquivo, "produtos");
                enviadas.Add(nova);
                urls.Add(nova);
            }
            // Add explícito: o Id (Guid) já vem preenchido, e pela navegação o EF trataria a foto como existente.
            context.ProdutoImagens.RemoveRange(produto.Imagens);
            context.ProdutoImagens.AddRange(urls.Select((url, i) => new ProdutoImagem { ProdutoId = produto.Id, Url = url, Ordem = i }));
            produto.ImagemUrl = urls.FirstOrDefault();
            await context.SaveChangesAsync();
        }
        catch
        {
            await uploads.RemoverAsync(enviadas); // não deixa arquivos órfãos se a edição falhar
            throw;
        }
        await uploads.RemoverAsync(atuais.Except(ordem.Where(f => f.Url is not null).Select(f => f.Url!)));
    }

    public async Task ExcluirAsync(Guid varejistaId, Guid produtoId)
    {
        await ciclo.AtualizarAsync();
        var produto = await context.Produtos.Include(p => p.Imagens)
            .SingleOrDefaultAsync(p => p.Id == produtoId && p.VarejistaId == varejistaId)
            ?? throw new InvalidOperationException("Alimento não encontrado neste estabelecimento.");
        // Reservas ativas e retiradas concluídas fazem parte do histórico de vendas, doações e impacto.
        var temRetirada = await context.Transacoes.AnyAsync(t => t.ProdutoId == produtoId &&
            (t.StatusReserva == StatusReserva.Ativa || t.StatusReserva == StatusReserva.Concluida));
        if (temRetirada || produto.Status is StatusProduto.Reservado or StatusProduto.Vendido or StatusProduto.Doado)
            throw new InvalidOperationException("Alimentos reservados, vendidos ou doados não podem ser excluídos.");
        var fotos = produto.Imagens.Select(i => i.Url).ToList();
        context.Produtos.Remove(produto); // reservas canceladas ou expiradas saem junto (cascade)
        await context.SaveChangesAsync();
        await uploads.RemoverAsync(fotos);
    }

    private static readonly Expression<Func<Produto, ProdutoResumoResponse>> ParaResumo = p => new ProdutoResumoResponse
    {
        Id = p.Id, Titulo = p.Titulo, Categoria = p.Categoria, Quantidade = p.Quantidade,
        DataValidade = p.DataValidade, Status = p.Status.ToString(), ImagemUrl = p.ImagemUrl,
        Imagens = p.Imagens.OrderBy(i => i.Ordem).Select(i => i.Url).ToList(),
        Descricao = p.Descricao, PrecoOriginal = p.PrecoOriginal, PrecoVenda = p.PrecoVenda, FrutaFeia = p.FrutaFeia,
        IsOferta = p.IsOferta, AlertaPreDoacao = p.AlertaPreDoacaoEnviado,
        AlertaVencimento = p.Status == StatusProduto.Vencido
    };

    // Regras comuns ao cadastro e à edição; devolve a validade em UTC.
    private static DateTime ValidarDados(string nome, int quantidade, DateTime dataValidade,
        decimal precoOriginal, decimal? precoDesconto, DateTime agora)
    {
        var validade = dataValidade.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(dataValidade, DateTimeKind.Utc) : dataValidade.ToUniversalTime();
        if (validade <= agora) throw new InvalidOperationException("A validade deve ser posterior ao momento atual.");
        if (string.IsNullOrWhiteSpace(nome) || quantidade <= 0 || precoOriginal < 0 ||
            precoDesconto < 0 || precoDesconto > precoOriginal)
            throw new InvalidOperationException("Confira o nome, a quantidade e os preços do alimento.");
        return validade;
    }

    private IQueryable<Produto> Consulta(string? busca)
    {
        var query = context.Produtos.AsNoTracking().Include(p => p.Varejista)
            .Include(p => p.Imagens.OrderBy(i => i.Ordem))
            .Where(p => p.Varejista!.StatusAprovacao == StatusAprovacao.Aprovado);
        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim().ToLower();
            query = query.Where(p => p.Titulo.ToLower().Contains(termo) ||
                p.Varejista!.NomeEstabelecimento.ToLower().Contains(termo));
        }
        return query;
    }

    public async Task<List<ProdutoVitrineResponse>> ListarVitrineAsync(string? busca, bool apenasFrutasFeias)
    {
        await ciclo.AtualizarAsync();
        var agora = clock.GetUtcNow().UtcDateTime;
        var limite = RegrasCicloVida.LimiteDoacao(agora);
        var query = Consulta(busca).Where(p =>
            (p.Status == StatusProduto.Disponivel || p.Status == StatusProduto.EmDesconto) && p.DataValidade > limite);
        if (apenasFrutasFeias) query = query.Where(p => p.FrutaFeia);
        var produtos = await query.OrderBy(p => p.DataValidade).ToListAsync();
        return produtos.Select(p => MapParaVitrine(p, agora, false)).ToList();
    }

    public async Task<List<ProdutoVitrineResponse>> ListarOfertasAsync(string? busca)
    {
        var produtos = await ListarVitrineAsync(busca, false);
        return produtos.Where(p => p.IsOferta == true).ToList();
    }

    public async Task<List<ProdutoVitrineResponse>> ListarDoacoesAsync(string? busca, bool apenasFrutasFeias = false)
    {
        await ciclo.AtualizarAsync();
        var agora = clock.GetUtcNow().UtcDateTime;
        var limite = RegrasCicloVida.LimitePrevia(agora);
        var query = Consulta(busca).Where(p => p.DataValidade > agora &&
            (p.Status == StatusProduto.DisponivelParaDoacao ||
             ((p.Status == StatusProduto.Disponivel || p.Status == StatusProduto.EmDesconto) && p.DataValidade <= limite)));
        if (apenasFrutasFeias) query = query.Where(p => p.FrutaFeia);
        var produtos = await query.OrderBy(p => p.DataValidade).ToListAsync();
        return produtos.Select(p => MapParaVitrine(p, agora, true)).ToList();
    }

    public async Task AnteciparDoacaoAsync(Guid varejistaId, Guid produtoId)
    {
        await ciclo.AtualizarAsync();
        var produto = await context.Produtos.SingleOrDefaultAsync(p => p.Id == produtoId && p.VarejistaId == varejistaId)
            ?? throw new InvalidOperationException("Alimento não encontrado neste estabelecimento.");
        if (!RegrasCicloVida.Comercial(produto) || produto.DataValidade <= clock.GetUtcNow().UtcDateTime)
            throw new InvalidOperationException("Somente alimentos disponíveis e válidos podem ser destinados à doação.");
        RegrasCicloVida.DisponibilizarDoacao(produto);
        await context.SaveChangesAsync();
    }

    private static ProdutoVitrineResponse MapParaVitrine(Produto p, DateTime agora, bool painelOng)
    {
        var doacao = p.Status == StatusProduto.DisponivelParaDoacao;
        var previa = painelOng && !doacao;
        var horas = Math.Max(0, (p.DataValidade - agora).TotalHours);
        return new ProdutoVitrineResponse
        {
            Id = p.Id, Nome = p.Titulo, Categoria = p.Categoria, ImagemUrl = p.ImagemUrl,
            Imagens = p.Imagens.Select(i => i.Url).ToList(), Descricao = p.Descricao, Quantidade = p.Quantidade,
            NomeVarejista = p.Varejista?.NomeEstabelecimento ?? "Estabelecimento",
            PrecoOriginal = p.PrecoOriginal, PrecoDesconto = doacao ? 0m : p.PrecoVenda,
            DescontoPercentual = doacao ? 100 : p.PrecoVenda.HasValue && p.PrecoOriginal > 0
                ? Math.Round((1 - p.PrecoVenda.Value / p.PrecoOriginal) * 100, 0) : null,
            IsOferta = p.IsOferta, DiasRestantes = (int)Math.Ceiling(horas / 24),
            HorasRestantes = horas, DataValidade = p.DataValidade, FrutaFeia = p.FrutaFeia,
            Status = p.Status.ToString(), PreviaDoacao = previa,
            PodeReservar = p.DataValidade > agora && (painelOng ? doacao : RegrasCicloVida.Comercial(p)),
            DisponivelParaReservaEm = previa ? RegrasCicloVida.LiberacaoParaDoacao(p) : null
        };
    }

    public Task VerificarValidadesAsync() => ciclo.AtualizarAsync();
}
