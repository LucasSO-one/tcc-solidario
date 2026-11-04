using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Data.Seeding;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

await using var conn = new SqliteConnection("Data Source=:memory:");
await conn.OpenAsync();
var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options;
await using var db = new AppDbContext(options);
await db.Database.EnsureCreatedAsync();
var casos = new[] { ("99", "admin"), ("Admin", "admin"), ("admin", "admin"), ("Admin", "Admin"), ("Consumidor", "admin") };
var ids = new List<Guid>();
foreach (var (tipo, discriminador) in casos)
{
    var id = Guid.NewGuid(); ids.Add(id);
    db.Admins.Add(new Admin { Id = id, Nome = "Teste legado", Email = $"{id:N}@example.invalid", SenhaHash = "hash-sintetico-preservado", Tipo = TipoUsuario.Admin, StatusAprovacao = StatusAprovacao.Aprovado, DataCriacao = DateTime.UtcNow });
    await db.SaveChangesAsync(); db.ChangeTracker.Clear();
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE \"Usuarios\" SET \"Tipo\"={tipo}, \"TipoUsuarioString\"={discriminador} WHERE \"Id\"={id}");
}
var checks = 0;
void Check(bool ok, string nome) { if (!ok) throw new Exception(nome); checks++; Console.WriteLine("PASSOU: " + nome); }
bool erroReproduzido = false;
try { await db.Usuarios.SingleAsync(u => u.Id == ids[0]); }
catch (InvalidOperationException ex) when (ex.Message.Contains("discriminator", StringComparison.OrdinalIgnoreCase)) { erroReproduzido = true; }
Check(erroReproduzido, "login reproduz falha de materializacao do legado");
db.ChangeTracker.Clear();
Check(await NormalizacaoAdminLegado.ExecutarAsync(db) == 3, "somente tres formatos administrativos antigos corrigidos");
for (var i = 0; i < 4; i++)
{
    var admin = await db.Usuarios.AsNoTracking().SingleAsync(u => u.Id == ids[i]);
    Check(admin is Admin && admin.Tipo == TipoUsuario.Admin, $"administrador {i} pode ser materializado");
    Check(admin.Id == ids[i] && admin.SenhaHash == "hash-sintetico-preservado" && admin.StatusAprovacao == StatusAprovacao.Aprovado, $"chave senha e aprovacao {i} preservadas");
}
Check(await NormalizacaoAdminLegado.ExecutarAsync(db) == 0, "nova execucao nao altera novamente");
await using var cmd = conn.CreateCommand();
cmd.CommandText = "SELECT COUNT(*) FROM \"Usuarios\" WHERE \"Tipo\"='Consumidor' AND \"TipoUsuarioString\"='admin'";
Check(Convert.ToInt32(await cmd.ExecuteScalarAsync()) == 1, "registro com perfil consumidor nao promovido");
cmd.CommandText = "SELECT COUNT(*) FROM \"Usuarios\"";
Check(Convert.ToInt32(await cmd.ExecuteScalarAsync()) == 5, "nenhuma conta criada ou excluida");
Console.WriteLine($"RESULTADO: {checks} verificacoes aprovadas em SQLite isolado; nenhum banco real acessado.");
