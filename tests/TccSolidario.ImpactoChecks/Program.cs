using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.Services;
using TccSolidario.Api.Services.Seguranca;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Hosting;

await using var conn = new SqliteConnection("Data Source=:memory:");
await conn.OpenAsync();
await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options);
await db.Database.EnsureCreatedAsync();
var now = DateTime.UtcNow;
var loja = new Varejista { Nome="Loja", Email="loja@example.invalid", Tipo=TipoUsuario.Varejista, StatusAprovacao=StatusAprovacao.Aprovado };
var cliente = new Consumidor { Nome="Cliente", Email="cliente@example.invalid", Tipo=TipoUsuario.Consumidor, StatusAprovacao=StatusAprovacao.Aprovado };
var ong = new Ong { Nome="ONG", Email="ong@example.invalid", Tipo=TipoUsuario.ONG, StatusAprovacao=StatusAprovacao.Aprovado };
var qa = new Varejista { Nome="QA", Email="qa@example.invalid", Tipo=TipoUsuario.Varejista, StatusAprovacao=StatusAprovacao.Aprovado, EhDadoTeste=true };
var clienteQa = new Consumidor { Nome="QA pessoa", Email="qa-pessoa@example.invalid", Tipo=TipoUsuario.Consumidor, StatusAprovacao=StatusAprovacao.Aprovado, EhDadoTeste=true };
var ongQa = new Ong { Nome="QA ONG", Email="qa-ong@example.invalid", Tipo=TipoUsuario.ONG, StatusAprovacao=StatusAprovacao.Pendente, EhDadoTeste=true };
db.AddRange(loja,cliente,ong,qa,clienteQa,ongQa);
Produto Lote(Varejista dono, int qtd, bool teste=false) => new() { Titulo="Fixture", Varejista=dono, Quantidade=qtd, EhDadoTeste=teste, DataValidade=now.AddDays(1) };
void Retirada(Produto p, Usuario destinatario, StatusReserva status=StatusReserva.Concluida) => db.Transacoes.Add(new() {
    Produto=p, Consumidor=destinatario as Consumidor, Ong=destinatario as Ong,
    Tipo=destinatario is Ong ? TipoTransacao.Doacao : TipoTransacao.Venda,
    StatusReserva=status, DataRetirada=status==StatusReserva.Concluida ? now : null, DataTransacao=now, DataExpiracao=now.AddHours(1)
});
Retirada(Lote(loja,3),cliente);
Retirada(Lote(loja,2),ong);
Retirada(Lote(loja,80,true),ong);
Retirada(Lote(qa,90),cliente); // exclui mesmo lotes anteriores à classificação do dono
Retirada(Lote(loja,70),clienteQa);
Retirada(Lote(loja,60),ongQa);
Retirada(Lote(loja,50),cliente,StatusReserva.Ativa);
await db.SaveChangesAsync();
var service = new ImpactoService(db,TimeProvider.System);
int checks=0;
void Check(bool ok,string label) { if(!ok) throw new Exception(label); Console.WriteLine("PASSOU: "+label); checks++; }
var admin = await service.ObterAsync(Guid.NewGuid(),TipoUsuario.Admin);
Check(admin.Indicadores["alimentosSalvos"]==5,"QA e reservas ativas não entram nas unidades");
Check(admin.Indicadores["doacoesRealizadas"]==1 && admin.Indicadores["ongsAtendidas"]==1,"ONG QA não entra nas doações");
Check(admin.Indicadores["usuarios"]==3 && admin.Indicadores["varejistasAtivos"]==1 && admin.Indicadores["cadastrosPendentes"]==0,"contas QA não entram nos totais");
Check(admin.Evolucao.Sum(e=>e.Doadas)==2 && admin.Evolucao.Sum(e=>e.Vendidas)==3,"evolução exclui QA por produto e participantes");
Check((await service.ObterAsync(loja.Id,TipoUsuario.Varejista)).Indicadores["alimentosSalvos"]==5,"relatório da loja usa o mesmo filtro");
Check((await service.ObterAsync(ong.Id,TipoUsuario.ONG)).Indicadores["unidadesRecebidas"]==2,"relatório ONG exclui lote sintético");
Check((await service.ObterAsync(cliente.Id,TipoUsuario.Consumidor)).Indicadores["alimentosComprados"]==3,"relatório consumidor exclui loja sintética");
loja.StatusAprovacao=StatusAprovacao.Excluido; cliente.StatusAprovacao=StatusAprovacao.Excluido;
await db.SaveChangesAsync();
admin = await service.ObterAsync(Guid.NewGuid(),TipoUsuario.Admin);
Check(admin.Indicadores["alimentosSalvos"]==5,"exclusão de conta real preserva histórico operacional");
Check(admin.Indicadores["usuarios"]==1 && admin.Indicadores["varejistasAtivos"]==0,"excluídos não entram nos cadastros vigentes");
Check(await db.Transacoes.CountAsync()==7,"histórico sintético preservado para auditoria");
foreach(var reportOnly in new bool?[] { null,true,false }) {
 var http=new DefaultHttpContext();
 var values = reportOnly.HasValue ? new Dictionary<string,string?> { ["Security:CspReportOnly"]=reportOnly.Value.ToString() } : new();
 ConfiguracaoSeguranca.Cabecalhos(http,new ConfigurationBuilder().AddInMemoryCollection(values).Build(),new Ambiente());
 var expected = reportOnly==true ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
 Check(http.Response.Headers[expected].ToString().Contains("script-src 'self'"),"CSP "+(reportOnly?.ToString()??"padrão")+" aplica modo correto");
}
Console.WriteLine($"RESULTADO: {checks} verificações aprovadas em banco isolado.");
sealed class Ambiente : IWebHostEnvironment {
 public string EnvironmentName {get;set;}="Production";
 public string ApplicationName {get;set;}="Fixture";
 public string WebRootPath {get;set;}="";
 public IFileProvider WebRootFileProvider {get;set;}=new NullFileProvider();
 public string ContentRootPath {get;set;}="";
 public IFileProvider ContentRootFileProvider {get;set;}=new NullFileProvider();
}
