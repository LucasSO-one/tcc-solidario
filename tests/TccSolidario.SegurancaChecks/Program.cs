using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using TccSolidario.Api.Data;
using TccSolidario.Api.Exceptions;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
using TccSolidario.Api.Services;
using TccSolidario.Api.Services.Seguranca;

var connectionString = Environment.GetEnvironmentVariable("VITTAFLOW_TEST_CONNECTION");
var sqlite = string.IsNullOrEmpty(connectionString);
await using var connection = new SqliteConnection("Data Source=:memory:");
var options = new DbContextOptionsBuilder<AppDbContext>();
if (sqlite) { await connection.OpenAsync(); options.UseSqlite(connection); }
else
{
    var cs = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
    if (cs.Host is not ("localhost" or "127.0.0.1") || cs.Database is null || !cs.Database.StartsWith("vittaflow_", StringComparison.Ordinal))
        throw new Exception("Testes permitem somente PostgreSQL local em banco vittaflow_*. Nunca usar produção.");
    options.UseNpgsql(connectionString);
}
await using var db = new AppDbContext(options.Options);
if (sqlite) await db.Database.EnsureCreatedAsync();
else await db.Database.MigrateAsync();
if (args.Contains("--seed-web-only")) { await TestFixtures.SeedAsync(db); return; }
var prefix = "security-" + Guid.NewGuid().ToString("N");
var root = Path.Combine(Path.GetTempPath(), prefix); Directory.CreateDirectory(root);
var env = new AmbienteTeste { ContentRootPath = root, WebRootPath = Path.Combine(root, "wwwroot") };
var clock = new RelogioTeste();
var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
{
    ["Jwt:Key"] = "CHAVE-EXCLUSIVA-DE-TESTES-LOCAIS-123456789012345678901234567890",
    ["Jwt:Issuer"] = "VittaTest", ["Jwt:Audience"] = "VittaTest",
    ["Security:EncryptionKey"] = Convert.ToBase64String(Enumerable.Range(1, 32).Select(i => (byte)i).ToArray()),
    ["Security:PublicOrigin"] = "http://localhost:55187", ["Storage:PersistentDirectory"] = root
}).Build();
var protection = new ProtecaoSegredos(config, env);
AutenticacaoService Auth(AppDbContext c) => new(c, protection, new(c, protection, config, env, clock), new(c, clock), new TokenService(config), clock);
var auth = Auth(db);
var uploads = new ImagemUploadService(env, config: config);
var contas = new ContaService(db, uploads, auth);
int total = 0;
void Check(bool ok, string nome) { if (!ok) throw new Exception("FALHOU: " + nome); total++; Console.WriteLine("PASSOU: " + nome); }
string Email(string nome) => nome + "-" + prefix + "@example.invalid";
const string senha = "Teste!42-SomenteFixture";
async Task<T> Criar<T>(T u) where T : Usuario { u.SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha, 12); db.Add(u); await db.SaveChangesAsync(); db.ChangeTracker.Clear(); return u; }

Check(EmailNormalizado.Normalizar(" Pessoa@Exemplo.COM ") == "pessoa@exemplo.com", "e-mail normalizado");
Check(EmailNormalizado.Valido("pessoa@example.com") && !EmailNormalizado.Valido("Pessoa <pessoa@example.com>"), "e-mail sem nome de exibição ou injeção de cabeçalho");
Check(!EmailNormalizado.SenhaValida(new string('A', 73) + "1!") && EmailNormalizado.SenhaValida(senha), "limite de 72 bytes do BCrypt");
Check(new CpfValidatorService().ValidarCpf("12345678909") && !new CpfValidatorService().ValidarCpf("00000000000"), "dígitos verificadores CPF");
Check(Documentos.CnpjValido("11222333000181") && !Documentos.CnpjValido("00000000000000"), "dígitos verificadores CNPJ numérico");
Check(Documentos.CnpjValido("12ABC34501DE35"), "exemplo oficial de CNPJ alfanumérico");
var secret = Totp.Base32(Encoding.ASCII.GetBytes("12345678901234567890"));
foreach (var (tempo, esperado) in new[] { (59L, "94287082"), (1111111109L, "07081804"), (1111111111L, "14050471"), (1234567890L, "89005924"), (2000000000L, "69279037"), (20000000000L, "65353130") })
    Check(Totp.Gerar(secret, tempo / 30, 8) == esperado, "vetor RFC 6238 em " + tempo);
var protectedValue = protection.Proteger("segredo-teste", "mfa:user-test");
Check(protection.Desproteger(protectedValue, "mfa:user-test") == "segredo-teste" && !protectedValue.Contains("segredo-teste"), "AES-GCM preserva e protege segredo");
bool refused = false; try { protection.Desproteger(protectedValue, "mfa:outra-pessoa"); } catch (CryptographicException) { refused = true; }
Check(refused, "finalidade criptográfica impede troca de segredo entre usuários");

var registro = new UsuarioRegistrationService(db, NullLogger<UsuarioRegistrationService>.Instance);
var user = new Consumidor { Nome = "Teste de cadastro", Email = Email("novo").ToUpperInvariant(), CPF = "12345678909", Telefone = "11900000000", Tipo = TipoUsuario.Consumidor };
await registro.RegistrarAsync(user, senha); var id = user.Id; db.ChangeTracker.Clear();
Check(!(await db.Usuarios.AsNoTracking().SingleAsync(u => u.Id == id)).EmailConfirmado, "cadastro novo não herda confirmação do default de legado");
try { await registro.RegistrarAsync(new Consumidor { Nome = "Duplicado", Email = Email("novo"), CPF = "12345678909", Tipo = TipoUsuario.Consumidor }, senha); throw new Exception("Duplicidade aceita."); }
catch (ConflictException) { Check(true, "registro recusa endereço com outra capitalização"); }
db.ChangeTracker.Clear();
var duplicate = new Consumidor { Nome = "Duplicado direto", Email = Email("novo").ToUpperInvariant(), CPF = "12345678909", Tipo = TipoUsuario.Consumidor };
db.Add(duplicate); bool unique = false; try { await db.SaveChangesAsync(); } catch (DbUpdateException) { unique = true; } db.ChangeTracker.Clear();
Check(unique, "índice do banco também impede duplicidade");
Check((await auth.LoginAsync(Email("novo"), senha)).Erro is not null, "login exige confirmação de e-mail"); db.ChangeTracker.Clear();
await auth.EnfileirarConfirmacaoAsync(id); db.ChangeTracker.Clear();
var queue = await db.EmailsPendentes.AsNoTracking().SingleAsync(e => e.UsuarioId == id);
var message = protection.Desproteger(queue.MensagemProtegida, "email:" + queue.Id);
var token = Regex.Match(message, "#token=([a-f0-9]{64})").Groups[1].Value;
Check(token.Length == 64 && !queue.MensagemProtegida.Contains(token), "link na fila fica criptografado");
Check(await db.TokensSeguranca.AnyAsync(t => t.Hash == ProtecaoSegredos.Hash(token)) && !await db.TokensSeguranca.AnyAsync(t => t.Hash == token), "banco guarda somente hash do token de uso único");
Check(await auth.ConsumirLinkAsync(token, null), "confirmação de e-mail funciona"); db.ChangeTracker.Clear();
Check(!await auth.ConsumirLinkAsync(token, null), "link de confirmação não pode ser reutilizado"); db.ChangeTracker.Clear();
var login = await auth.LoginAsync(Email("novo").ToUpperInvariant(), senha); db.ChangeTracker.Clear();
Check(login.Usuario?.Id == id && login.Jwt is not null, "login com capitalização diferente autentica a mesma conta");
var session = await db.SessoesAutenticacao.AsNoTracking().SingleAsync(s => s.UsuarioId == id);
await contas.AlterarSenhaAsync(id, new() { SenhaAtual = senha, NovaSenha = "OutraSenha!43-Fixture" }); db.ChangeTracker.Clear();
Check(session.VersaoUsuario != (await db.Usuarios.AsNoTracking().SingleAsync(u => u.Id == id)).VersaoSeguranca, "troca de senha invalida versão das sessões antigas");
await auth.SolicitarLinkAsync(Email("novo"), false); db.ChangeTracker.Clear();
var resetMail = await db.EmailsPendentes.AsNoTracking().Where(e => e.UsuarioId == id).OrderByDescending(e => e.CriadoEmUtc).ThenByDescending(e => e.Id).ToListAsync();
var resetMessage = resetMail.Select(e => protection.Desproteger(e.MensagemProtegida, "email:" + e.Id)).First(m => m.Contains("redefinir-senha"));
var reset = Regex.Match(resetMessage, "#token=([a-f0-9]{64})").Groups[1].Value;
Check(!await auth.ConsumirLinkAsync(reset, null), "token de recuperação não serve para confirmar e-mail"); db.ChangeTracker.Clear();
Check(await auth.ConsumirLinkAsync(reset, "SenhaFinal!45-Fixture"), "recuperação redefine senha"); db.ChangeTracker.Clear();
Check(!await auth.ConsumirLinkAsync(reset, "Outra!46-Fixture"), "link de recuperação é de uso único"); db.ChangeTracker.Clear();
Check((await db.SessoesAutenticacao.AsNoTracking().SingleAsync(s => s.Id == session.Id)).RevogadaEmUtc.HasValue, "recuperação revoga sessões no banco");

foreach (var org in new Usuario[] { new Varejista { NomeEstabelecimento = "Loja QA", RazaoSocial = "QA" }, new Ong { NomeFantasia = "ONG QA" } })
{
    org.Email = Email(org is Ong ? "ong" : "loja"); org.Nome = "Pessoa teste"; org.Tipo = org is Ong ? TipoUsuario.ONG : TipoUsuario.Varejista; org.StatusAprovacao = StatusAprovacao.Aprovado;
    await Criar(org); var profile = await contas.ObterAsync(org.Id);
    await contas.AtualizarAsync(org.Id, new() { Nome = profile.Nome, Email = profile.Email, Organizacao = profile.Organizacao, Endereco = new() { Cep = "00000000", Rua = "Rua QA", Numero = "0", Bairro = "QA", Cidade = "QA", Estado = "SP" } }); db.ChangeTracker.Clear();
    Check(await db.Enderecos.CountAsync(e => e.UsuarioId == org.Id) == 1, "primeiro endereço executa INSERT em " + org.Tipo);
    Check((await contas.ObterAsync(org.Id)).Endereco?.Rua == "Rua QA", "endereço persiste em " + org.Tipo);
}

var admin = await Criar(new Admin { Nome = "Admin QA", Email = Email("admin"), Tipo = TipoUsuario.Admin, StatusAprovacao = StatusAprovacao.Aprovado });
var setup = await auth.LoginAsync(admin.Email, senha); db.ChangeTracker.Clear();
Check(setup.ConfigurarMfa && setup.Jwt is null && !await db.SessoesAutenticacao.AnyAsync(s => s.UsuarioId == admin.Id), "senha sozinha não concede sessão administrativa");
var counter = clock.GetUtcNow().ToUnixTimeSeconds() / 30;
var code = Totp.Gerar(setup.Segredo!, counter);
Check((await auth.ConfirmarMfaAsync(setup.Desafio!, code == "000000" ? "111111" : "000000", null)).Erro is not null, "código MFA errado recusado"); db.ChangeTracker.Clear();
var complete = await auth.ConfirmarMfaAsync(setup.Desafio!, code, null); db.ChangeTracker.Clear();
Check(complete.Jwt is not null && complete.CodigosRecuperacao?.Length == 10, "MFA gera sessão e dez códigos de recuperação");
Check((await db.Usuarios.AsNoTracking().SingleAsync(u => u.Id == admin.Id)).SegredoMfaProtegido != setup.Segredo, "segredo MFA não fica em texto no banco");
var again = await auth.LoginAsync(admin.Email, senha); db.ChangeTracker.Clear();
Check(!again.ConfigurarMfa && again.Jwt is null, "próximo login administrativo exige segundo fator");
Check((await auth.ConfirmarMfaAsync(again.Desafio!, code, null)).Erro is not null, "mesmo passo TOTP não é reutilizado"); db.ChangeTracker.Clear();
var recovery = await auth.ConfirmarMfaAsync(again.Desafio!, "", complete.CodigosRecuperacao![0]); db.ChangeTracker.Clear();
Check(recovery.ConfigurarMfa && recovery.Jwt is null && recovery.Segredo != setup.Segredo, "recuperação exige novo autenticador antes de acessar");
var completeRecovery = await auth.ConfirmarMfaAsync(recovery.Desafio!, Totp.Gerar(recovery.Segredo!, counter), null); db.ChangeTracker.Clear();
Check(completeRecovery.Jwt is not null, "novo autenticador conclui recuperação");
var third = await auth.LoginAsync(admin.Email, senha); db.ChangeTracker.Clear();
Check((await auth.ConfirmarMfaAsync(third.Desafio!, "", complete.CodigosRecuperacao[0])).Erro is not null, "código de recuperação antigo não pode ser reutilizado"); db.ChangeTracker.Clear();
for (var i = 0; i < 8; i++) { await auth.LoginAsync(Email("inexistente"), senha); db.ChangeTracker.Clear(); }
await using (var novoContexto = new AppDbContext(options.Options))
{
    bool limited = false; try { await Auth(novoContexto).LoginAsync(Email("inexistente"), senha); } catch (LimiteExcedidoException) { limited = true; }
    Check(limited, "limite de login persiste em novo contexto/instância");
}
Check(await db.EventosAuditoria.AnyAsync(e => e.Acao == "auth.login" && !e.Sucesso), "falhas de autenticação geram auditoria sem credenciais");

if (args.Contains("--seed-web")) await TestFixtures.SeedAsync(db);
Console.WriteLine($"RESULTADO: {total} verificações de segurança aprovadas em {(sqlite ? "SQLite isolado" : "PostgreSQL local isolado")}.");

sealed class RelogioTeste : TimeProvider { private readonly DateTimeOffset agora = DateTimeOffset.UtcNow; public override DateTimeOffset GetUtcNow() => agora; }
sealed class AmbienteTeste : IWebHostEnvironment
{
    public string EnvironmentName { get; set; } = "Testing";
    public string ApplicationName { get; set; } = "VittaFlow.Tests";
    public string ContentRootPath { get; set; } = "";
    public string WebRootPath { get; set; } = "";
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
}
