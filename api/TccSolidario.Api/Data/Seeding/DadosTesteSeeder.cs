using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
namespace TccSolidario.Api.Data.Seeding;

/// <summary>
/// Cria usuários e alimentos para demonstrar a plataforma e testar o fluxo no ambiente local.
/// Executado apenas em Development. As datas são relativas ao momento da execução,
/// então use "dotnet run -- --reset-dados-teste" para recriar os cenários com prazos atuais.
/// </summary>
public static class DadosTesteSeeder
{
    public const string Senha = "Teste@123";
    public const string EmailVarejista = "varejista@teste.com";
    public const string EmailConsumidor = "consumidor@teste.com";
    public const string EmailOng = "ong@teste.com";
    private static readonly string[] Emails = [EmailVarejista, EmailConsumidor, EmailOng];

    public static void Executar(AppDbContext context, bool recriar)
    {
        var existentes = context.Usuarios.Where(u => Emails.Contains(u.Email)).ToList();
        if (existentes.Count > 0 && !recriar) return;
        if (existentes.Count > 0) Remover(context, existentes.Select(u => u.Id).ToList());

        var agora = DateTime.UtcNow;
        var senhaHash = BCrypt.Net.BCrypt.HashPassword(Senha);

        var varejista = new Varejista
        {
            Nome = "Carlos Almeida", Email = EmailVarejista, Telefone = "31999991001", SenhaHash = senhaHash,
            Tipo = TipoUsuario.Varejista, StatusAprovacao = StatusAprovacao.Aprovado,
            CNPJ = "11222333000181", RazaoSocial = "Mercado Bom Preço LTDA",
            NomeEstabelecimento = "Mercado Bom Preço", HorarioFuncionamento = "Seg a Sáb, 08h às 20h", TipoEstabelecimento = "Supermercado",
            Enderecos = [new() { Rua = "Rua das Flores", Numero = "120", Bairro = "Centro",
                Cidade = "Belo Horizonte", Estado = "MG", CEP = "30110000" }]
        };
        var consumidor = new Consumidor
        {
            Nome = "Ana Souza", Email = EmailConsumidor, Telefone = "31999992002", SenhaHash = senhaHash,
            Tipo = TipoUsuario.Consumidor, StatusAprovacao = StatusAprovacao.Aprovado,
            CPF = "52998224725", DataNascimento = new DateTime(1998, 5, 10, 0, 0, 0, DateTimeKind.Utc)
        };
        var ong = new Ong
        {
            Nome = "Juliana Lima", Email = EmailOng, Telefone = "31999993003", SenhaHash = senhaHash,
            Tipo = TipoUsuario.ONG, StatusAprovacao = StatusAprovacao.Aprovado,
            CNPJ = "11444777000161", NomeFantasia = "ONG Mãos que Alimentam", AreaAtuacao = "Segurança alimentar",
            CapacidadeRecebimento = "Até 200 unidades por semana, com câmara fria", HorarioFuncionamento = "Seg a Sex, 09h às 17h",
            Enderecos = [new() { Rua = "Av. Brasil", Numero = "455", Bairro = "Santa Efigênia",
                Cidade = "Belo Horizonte", Estado = "MG", CEP = "30140000" }]
        };
        context.AddRange(varejista, consumidor, ong);

        Produto NovoProduto(string titulo, string categoria, string descricao, double horas, decimal preco,
            decimal? desconto, StatusProduto status, int quantidade, bool oferta = false, bool frutaFeia = false,
            params string[] fotos) => new()
        {
            Titulo = titulo, Categoria = categoria, Descricao = descricao,
            DataValidade = agora.AddHours(horas), PrecoOriginal = preco, PrecoVenda = desconto,
            IsOferta = oferta, FrutaFeia = frutaFeia, Quantidade = quantidade, Status = status,
            VarejistaId = varejista.Id, ImagemUrl = fotos.Length > 0 ? $"/seed/{fotos[0]}" : null,
            Imagens = fotos.Select((f, i) => new ProdutoImagem { Url = $"/seed/{f}", Ordem = i }).ToList()
        };

        // Vitrine do consumidor (mais de 36h para vencer)
        var maca = NovoProduto("Maçã verde Granny Smith 1kg", "Hortifruti",
            "Maçãs com pequenas manchas e marcas na casca, sem alteração no sabor ou na textura. Ótimas para consumo in natura, tortas e sucos.",
            4 * 24, 14.90m, 6.90m, StatusProduto.EmDesconto, 10, frutaFeia: true, fotos: "maca.jpg");
        var iogurte = NovoProduto("Iogurte natural integral 170g (pack c/ 4)", "Laticínios",
            "Iogurte natural integral, sem adição de açúcar. Embalagens lacradas, mantidas refrigeradas entre 1 °C e 8 °C.",
            3 * 24, 13.90m, 8.90m, StatusProduto.EmDesconto, 8, oferta: true);
        var leite = NovoProduto("Leite integral UHT 1L (caixa c/ 12)", "Laticínios",
            "Caixa fechada com 12 unidades de leite integral longa vida. Validade próxima, produto em perfeito estado.",
            6 * 24, 71.90m, 49.90m, StatusProduto.EmDesconto, 4, oferta: true);
        var banana = NovoProduto("Banana prata 1kg (fora do padrão)", "Hortifruti",
            "Bananas maduras, algumas com a casca pintada. No ponto ideal para comer, fazer vitaminas, bolos e doces.",
            3 * 24, 6.99m, 2.99m, StatusProduto.EmDesconto, 15, frutaFeia: true);

        // Menos de 24h para vencer: disponíveis para doação (vitrine da ONG)
        var paoFrances = NovoProduto("Pão francês (saco de 1kg)", "Padaria",
            "Pães produzidos hoje pela nossa padaria. Indicados para consumo até amanhã ou para congelar.",
            10, 16.90m, 0m, StatusProduto.DisponivelParaDoacao, 5, fotos: "pao.jpg");
        var arroz = NovoProduto("Arroz branco cozido (bandeja de 2kg)", "Refeições",
            "Arroz preparado hoje na cozinha do mercado, porcionado em bandejas térmicas lacradas. Manter refrigerado e consumir em até 24h.",
            8, 22.00m, 0m, StatusProduto.DisponivelParaDoacao, 6, fotos: "arroz.jpg");
        var queijo = NovoProduto("Queijo minas frescal 500g", "Laticínios",
            "Peças embaladas a vácuo, mantidas sob refrigeração. Validade termina amanhã.",
            20, 26.90m, 0m, StatusProduto.DisponivelParaDoacao, 5);
        var alface = NovoProduto("Alface crespa hidropônica", "Hortifruti",
            "Pés de alface hidropônica com as folhas externas levemente murchas. O miolo está fresco e próprio para consumo.",
            16, 3.99m, 0m, StatusProduto.DisponivelParaDoacao, 18, frutaFeia: true);

        context.Produtos.AddRange(maca, iogurte, leite, banana, paoFrances, arroz, queijo, alface);

        context.SaveChanges();
    }

    private static void Remover(AppDbContext context, List<Guid> usuarioIds)
    {
        var produtoIds = context.Produtos.Where(p => usuarioIds.Contains(p.VarejistaId)).Select(p => p.Id).ToList();
        context.Transacoes.Where(t => produtoIds.Contains(t.ProdutoId) ||
            (t.OngId != null && usuarioIds.Contains(t.OngId.Value)) ||
            (t.ConsumidorId != null && usuarioIds.Contains(t.ConsumidorId.Value))).ExecuteDelete();
        context.Produtos.Where(p => produtoIds.Contains(p.Id)).ExecuteDelete();
        context.Usuarios.Where(u => usuarioIds.Contains(u.Id)).ExecuteDelete();
    }
}
