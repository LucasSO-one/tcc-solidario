using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
namespace TccSolidario.Api.Data.Seeding;

/// <summary>
/// Cria usuários, alimentos e reservas para testar o fluxo completo no ambiente local.
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

        Produto NovoProduto(string titulo, string categoria, double horas, decimal preco, decimal? desconto,
            StatusProduto status, int quantidade = 10, bool oferta = false, bool frutaFeia = false,
            params string[] fotos) => new()
        {
            Titulo = titulo, Categoria = categoria, Descricao = $"{titulo} - lote de teste",
            DataValidade = agora.AddHours(horas), PrecoOriginal = preco, PrecoVenda = desconto,
            IsOferta = oferta, FrutaFeia = frutaFeia, Quantidade = quantidade, Status = status,
            VarejistaId = varejista.Id, ImagemUrl = fotos.Length > 0 ? $"/seed/{fotos[0]}" : null,
            Imagens = fotos.Select((f, i) => new ProdutoImagem { Url = $"/seed/{f}", Ordem = i }).ToList()
        };

        // Vitrine do consumidor (mais de 24h para vencer)
        var pao = NovoProduto("Pão de forma integral", "Padaria", 5 * 24, 12.90m, 6.90m, StatusProduto.EmDesconto, oferta: true, fotos: "pao.jpg");
        var cafe = NovoProduto("Cesta café da manhã", "Padaria", 2 * 24, 29.90m, 17.90m, StatusProduto.EmDesconto, 4, true, false, "pao.jpg", "maca.jpg");
        var leiteCaixa = NovoProduto("Leite integral 1L (caixa c/ 12)", "Laticínios", 4 * 24, 72.00m, 48.00m, StatusProduto.EmDesconto, 3, oferta: true);
        var banana = NovoProduto("Banana prata (fora do padrão)", "Hortifruti", 3 * 24, 8.00m, 3.50m, StatusProduto.EmDesconto, 15, frutaFeia: true);
        var suco = NovoProduto("Suco de laranja 1L", "Bebidas", 3 * 24, 9.90m, null, StatusProduto.Disponivel, 8);
        // Entre 24h e 36h: ainda à venda e aparece como prévia para a ONG
        var queijo = NovoProduto("Queijo minas frescal 500g", "Laticínios", 30, 24.90m, 14.90m, StatusProduto.EmDesconto, 4);
        // Menos de 24h: disponível para doação (vitrine da ONG)
        var iogurte = NovoProduto("Iogurte natural (bandeja c/ 6)", "Laticínios", 20, 15.90m, 0m, StatusProduto.DisponivelParaDoacao, 6);
        var alface = NovoProduto("Alface crespa", "Hortifruti", 12, 4.50m, 0m, StatusProduto.DisponivelParaDoacao, 20, frutaFeia: true);
        var bolo = NovoProduto("Bolo de cenoura", "Padaria", 16, 28.00m, 0m, StatusProduto.DisponivelParaDoacao, 2);
        var cesta = NovoProduto("Cesta de alimentos variados", "Mercearia", 22, 45.00m, 0m, StatusProduto.DisponivelParaDoacao, 5, false, false, "arroz.jpg", "pao.jpg", "maca.jpg");
        // Reservas ativas aguardando retirada
        var frango = NovoProduto("Frango resfriado 1kg", "Carnes", 18, 19.90m, 0m, StatusProduto.Reservado, 5);
        var presunto = NovoProduto("Presunto fatiado 200g", "Frios", 2 * 24, 11.90m, 7.90m, StatusProduto.Reservado, 3);
        // Histórico: já entregues e vencido
        var arroz = NovoProduto("Marmitas do dia", "Refeições", -26, 18.00m, 0m, StatusProduto.Doado, 12, fotos: "arroz.jpg");
        var tomate = NovoProduto("Tomate italiano", "Hortifruti", -10, 7.50m, 0m, StatusProduto.Doado, 10, frutaFeia: true);
        var biscoito = NovoProduto("Biscoito amanteigado", "Mercearia", 6 * 24, 6.90m, 3.90m, StatusProduto.Vendido, 2);
        var requeijao = NovoProduto("Requeijão cremoso", "Laticínios", -3, 8.90m, 0m, StatusProduto.Vencido, 3);
        context.Produtos.AddRange(pao, cafe, cesta, leiteCaixa, banana, suco, queijo, iogurte, alface, bolo,
            frango, presunto, arroz, tomate, biscoito, requeijao);

        Transacao NovaReserva(Produto produto, Usuario receptor, string codigo, StatusReserva status,
            DateTime data, DateTime? retirada = null)
        {
            var doacao = receptor is Ong;
            return new Transacao
            {
                ProdutoId = produto.Id, Tipo = doacao ? TipoTransacao.Doacao : TipoTransacao.Venda,
                ValorFinal = doacao ? 0m : produto.PrecoVenda ?? produto.PrecoOriginal,
                CodigoRetirada = codigo, StatusReserva = status, DataTransacao = data,
                DataExpiracao = data.AddHours(RegrasCicloVida.HorasReserva), DataRetirada = retirada,
                OngId = doacao ? receptor.Id : null, ConsumidorId = doacao ? null : receptor.Id
            };
        }

        context.Transacoes.AddRange(
            // Ativas: use estes códigos na tela "Validar retirada" do varejista
            NovaReserva(frango, ong, "TEST-DAC2", StatusReserva.Ativa, agora),
            NovaReserva(presunto, consumidor, "TEST-VND3", StatusReserva.Ativa, agora),
            // Concluídas: aparecem em "Meus resgates" (ONG) e "Retiradas recentes" (varejista)
            NovaReserva(arroz, ong, "HIST-DAC4", StatusReserva.Concluida, agora.AddHours(-48), agora.AddHours(-47)),
            NovaReserva(tomate, ong, "HIST-DAC5", StatusReserva.Concluida, agora.AddHours(-30), agora.AddHours(-29)),
            NovaReserva(biscoito, consumidor, "HIST-VND6", StatusReserva.Concluida, agora.AddHours(-20), agora.AddHours(-19)),
            // Histórico de reservas encerradas sem retirada
            NovaReserva(alface, ong, "HIST-EXP7", StatusReserva.Expirada, agora.AddHours(-6)),
            NovaReserva(suco, consumidor, "HIST-CAN8", StatusReserva.Cancelada, agora.AddHours(-5)));

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
