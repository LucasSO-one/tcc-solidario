using System.Net;
using System.Text.Json;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using TccSolidario.Api.Services;

// SDK real, servidor HTTP exclusivamente loopback e credenciais fictícias. Sem banco ou Cloudinary real.
var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing", ContentRootPath = Path.GetTempPath() });
builder.Logging.ClearProviders(); builder.WebHost.UseUrls("http://127.0.0.1:0");
await using var server = builder.Build();
var responses = new Queue<(int Status, object Body)>(); int requests = 0;
server.MapPost("/{**path}", async ctx => {
    await ctx.Request.Body.CopyToAsync(Stream.Null); requests++;
    var reply = responses.Dequeue(); ctx.Response.StatusCode = reply.Status;
    await ctx.Response.WriteAsJsonAsync(reply.Body);
});
await server.StartAsync();
try
{
    var cloud = new Cloudinary(new Account("qa-fixture", "123456-fixture", "NAO-VAZAR-SECRET-FIXTURE"));
    cloud.Api.ApiBaseAddress = server.Urls.Single(); cloud.Api.Secure = false; // HTTP somente no stub local.
    var logs = new LogTeste();
    var uploads = new ImagemUploadService(new Ambiente(), cloud, logger: logs);
    var bytes = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=");
    using var stream = new MemoryStream(bytes);
    var file = new FormFile(stream, 0, bytes.Length, "foto", "foto-teste.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
    int total = 0;
    void Check(bool ok, string text) { if (!ok) throw new Exception("FALHOU: " + text); total++; Console.WriteLine("PASSOU: " + text); }
    foreach (var (status, raw, category, expected) in new[] {
        (401, "Invalid Signature NAO-VAZAR-SECRET-FIXTURE", "credenciais", "autorizar"),
        (400, "Unknown API key 123456-fixture", "credenciais", "autorizar"),
        (400, "Unknown cloud name qa-fixture", "ambiente", "configuração"),
        (400, "cloud_name is disabled", "conta-desativada", "desativado"),
        (403, "Not allowed", "permissao", "não permitiu"),
        (420, "Rate limited", "limite", "limite"),
        (429, "Rate limited", "limite", "limite"),
        (400, "Invalid image file", "requisicao", "processar a imagem"),
        (500, "Failure NAO-VAZAR-SECRET-FIXTURE", "indisponivel", "indisponível")
    })
    {
        responses.Enqueue((status, new { error = new { message = raw } }));
        string message = "";
        try { await uploads.SalvarAsync(file, "produtos"); } catch (InvalidOperationException ex) { message = ex.Message; }
        Check(message.Contains(expected, StringComparison.OrdinalIgnoreCase), "resposta segura para HTTP " + status + "/" + category);
        Check(logs.Text.Contains("categoria " + category) && logs.Text.Contains("HTTP " + status), "diagnóstico HTTP/categoria " + category);
        Check(!logs.Text.Contains("NAO-VAZAR") && !logs.Text.Contains("123456-fixture") && !logs.Text.Contains("qa-fixture")
            && !message.Contains("NAO-VAZAR") && !message.Contains("123456-fixture"), "credenciais e resposta bruta não vazam em " + category);
    }
    responses.Enqueue((200, new { }));
    string missing = ""; try { await uploads.SalvarAsync(file, "produtos"); } catch (InvalidOperationException ex) { missing = ex.Message; }
    Check(missing.Contains("não confirmou"), "HTTP 200 sem URL não é aceito como sucesso");
    const string url = "https://res.cloudinary.com/qa-fixture/image/upload/v1/tcc-solidario/produtos/imagem.png";
    responses.Enqueue((200, new { secure_url = url, public_id = "tcc-solidario/produtos/imagem", version = 1 }));
    Check(await uploads.SalvarAsync(file, "produtos") == url, "upload bem-sucedido preserva URL HTTPS");
    Check(requests == 11 && responses.Count == 0, "SDK exercitou somente os onze envios ao servidor local");
    Console.WriteLine($"RESULTADO: {total} verificações de upload aprovadas, sem serviços externos.");
}
finally { await server.StopAsync(); }

sealed class LogTeste : ILogger<ImagemUploadService>
{
    public string Text { get; private set; } = "";
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel level) => true;
    public void Log<TState>(LogLevel level, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        => Text += formatter(state, exception) + "\n";
}
sealed class Ambiente : IWebHostEnvironment
{
    public string EnvironmentName { get; set; } = "Testing";
    public string ApplicationName { get; set; } = "ImagesTest";
    public string WebRootPath { get; set; } = "";
    public string ContentRootPath { get; set; } = "";
    public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
}
