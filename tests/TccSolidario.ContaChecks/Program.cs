using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Hosting;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.Services;
using TccSolidario.Api.DTOs.Conta;
using TccSolidario.Api.Exceptions;

var total = 0;
void Check(bool ok, string reason) { if (!ok) throw new Exception(reason); total++; }
async Task Reject<T>(Func<Task> action) where T:Exception { try { await action(); } catch (T) { total++; return; } throw new Exception("Operação deveria ter sido recusada: " + typeof(T).Name); }
await using var connection = new SqliteConnection("DataSource=:memory:");
await connection.OpenAsync();
var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
await using var db = new AppDbContext(options);
await db.Database.EnsureCreatedAsync();
var senha = BCrypt.Net.BCrypt.HashPassword("Teste!123");
var cliente = new Consumidor { Nome="Pessoa", Email="pessoa@teste.com", CPF="12345678901", Telefone="35999999999", SenhaHash=senha, Tipo=TipoUsuario.Consumidor, StatusAprovacao=StatusAprovacao.Aprovado, DataNascimento=DateTime.UtcNow.AddYears(-25) };
cliente.Enderecos.Add(new Endereco { Rua="Rua pessoal", Numero="1", Bairro="Centro", Cidade="Alfenas", Estado="MG", CEP="37130000" });
var varejista = new Varejista { Nome="Responsável", Email="loja@teste.com", CNPJ="12345678000199", NomeEstabelecimento="Loja", RazaoSocial="Razao", SenhaHash=senha, Tipo=TipoUsuario.Varejista, StatusAprovacao=StatusAprovacao.Aprovado };
var ong = new Ong { Nome="Responsável ONG", Email="ong@teste.com", CNPJ="12345678000299", NomeFantasia="ONG", AreaAtuacao="Alimentos", SenhaHash=senha, Tipo=TipoUsuario.ONG, StatusAprovacao=StatusAprovacao.Aprovado };
var admin = new Admin { Nome="Administrador", Email="admin@teste.com", SenhaHash=senha, Tipo=TipoUsuario.Admin, StatusAprovacao=StatusAprovacao.Aprovado };
var produto=new Produto { Titulo="Pães", Categoria="Padaria", Quantidade=10, PrecoOriginal=10, DataValidade=DateTime.UtcNow.AddDays(3), Varejista=varejista, Status=StatusProduto.Reservado };
var reserva=new Transacao { Produto=produto, Consumidor=cliente, Tipo=TipoTransacao.Venda, CodigoRetirada="ABC123", DataExpiracao=DateTime.UtcNow.AddHours(2), StatusReserva=StatusReserva.Ativa };
db.AddRange(cliente,varejista,ong,admin,produto,reserva);await db.SaveChangesAsync();
var service=new ContaService(db,new ImagemUploadService(new EnvironmentFake()));
var req=new ExcluirContaRequest { SenhaAtual="Teste!123", Confirmacao="EXCLUIR" };
await Reject<ValidacaoException>(()=>service.ExcluirAsync(cliente.Id,new(){SenhaAtual="errada",Confirmacao="EXCLUIR"}));
await Reject<InvalidOperationException>(()=>service.ExcluirAsync(cliente.Id,new(){SenhaAtual="Teste!123",Confirmacao="excluir"}));
await Reject<ConflictException>(()=>service.ExcluirAsync(cliente.Id,req));
await Reject<ConflictException>(()=>service.ExcluirAsync(varejista.Id,req));
Check(RegrasAcesso.PodeAcessar(cliente),"Recusa não pode excluir conta");
reserva.StatusReserva=StatusReserva.Concluida;produto.Status=StatusProduto.Vendido;await db.SaveChangesAsync();
await service.ExcluirAsync(cliente.Id,req);
Check(cliente.StatusAprovacao==StatusAprovacao.Excluido && !RegrasAcesso.PodeAcessar(cliente),"Acesso bloqueado para JWT antigo");
Check(cliente.CPF=="" && cliente.Telefone=="" && cliente.Nome=="Conta excluída" && cliente.Email!="pessoa@teste.com","Dados de perfil removidos");
Check(!BCrypt.Net.BCrypt.Verify("Teste!123",cliente.SenhaHash),"Senha anterior inválida");
Check(!await db.Enderecos.AnyAsync(e=>e.UsuarioId==cliente.Id),"Endereço eliminado");
Check(await db.Transacoes.AnyAsync(t=>t.Id==reserva.Id && t.ConsumidorId==cliente.Id && t.StatusReserva==StatusReserva.Concluida),"Histórico preservado");
await Reject<KeyNotFoundException>(()=>service.ObterAsync(cliente.Id));
await Reject<KeyNotFoundException>(()=>service.AlterarSenhaAsync(cliente.Id,new(){SenhaAtual="Teste!123",NovaSenha="Nova!123"}));
await service.ExcluirAsync(varejista.Id,req);
Check(varejista.CNPJ=="" && varejista.RazaoSocial=="" && !RegrasAcesso.PodeAcessar(varejista),"Varejista excluído");
Check(await db.Produtos.AnyAsync(p=>p.Id==produto.Id),"Lote do histórico preservado");
await service.ExcluirAsync(ong.Id,req);
Check(ong.CNPJ=="" && ong.AreaAtuacao=="" && !RegrasAcesso.PodeAcessar(ong),"ONG excluída");
await Reject<ConflictException>(()=>service.ExcluirAsync(admin.Id,req));
db.Admins.Add(new Admin { Nome="Admin 2", Email="admin2@teste.com", SenhaHash=senha, Tipo=TipoUsuario.Admin, StatusAprovacao=StatusAprovacao.Aprovado });await db.SaveChangesAsync();
await service.ExcluirAsync(admin.Id,req);Check(!RegrasAcesso.PodeAcessar(admin),"Admin excluído quando existe substituto");
var expirado = new Consumidor { Nome="Reserva antiga", Email="antiga@teste.com", CPF="98765432100", SenhaHash=senha, Tipo=TipoUsuario.Consumidor, StatusAprovacao=StatusAprovacao.Aprovado };
var lojaAtiva = new Varejista { Nome="Loja ativa", Email="ativa@teste.com", CNPJ="11222333000181", NomeEstabelecimento="Loja ativa", SenhaHash=senha, Tipo=TipoUsuario.Varejista, StatusAprovacao=StatusAprovacao.Aprovado };
var loteAntigo = new Produto { Titulo="Lote antigo", Categoria="Padaria", Quantidade=1, PrecoOriginal=5, Varejista=lojaAtiva, DataValidade=DateTime.UtcNow.AddDays(3), Status=StatusProduto.Reservado };
var retiradaAntiga = new Transacao { Produto=loteAntigo, Consumidor=expirado, Tipo=TipoTransacao.Venda, CodigoRetirada="ANT123", DataExpiracao=DateTime.UtcNow.AddHours(-1), StatusReserva=StatusReserva.Ativa };
db.AddRange(expirado,lojaAtiva,loteAntigo,retiradaAntiga);await db.SaveChangesAsync();
await service.ExcluirAsync(expirado.Id,req);
Check(retiradaAntiga.StatusReserva==StatusReserva.Expirada && !RegrasAcesso.PodeAcessar(expirado),"Reserva expirada não impede exclusão");
Check(loteAntigo.Status==StatusProduto.Disponivel,"Lote retorna ao fluxo após expiração");
await using var fresh = new AppDbContext(options);
Check(!RegrasAcesso.PodeAcessar(await fresh.Usuarios.SingleAsync(u=>u.Id==cliente.Id)),"Exclusão persiste após novo contexto");
Console.WriteLine($"PASSOU: {total} verificações de exclusão de conta (SQLite isolado, sem dados reais).");

class EnvironmentFake : IWebHostEnvironment {
 public string ApplicationName {get;set;}="Teste"; public string EnvironmentName {get;set;}="Testing";
 public string ContentRootPath {get;set;}=Path.GetTempPath();public IFileProvider ContentRootFileProvider {get;set;}=new NullFileProvider();
 public string WebRootPath {get;set;}=Path.GetTempPath();public IFileProvider WebRootFileProvider {get;set;}=new NullFileProvider();
}
