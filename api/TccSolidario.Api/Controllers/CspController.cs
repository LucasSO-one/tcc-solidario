using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace TccSolidario.Api.Controllers;

[ApiController]
[Route("api/security/csp")]
public class CspController(ILogger<CspController> logger) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> Receber(CancellationToken ct)
    {
        try
        {
            using var doc = await JsonDocument.ParseAsync(Request.Body, new JsonDocumentOptions { MaxDepth = 5 }, ct);
            if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("csp-report", out var report)
                && report.ValueKind == JsonValueKind.Object && report.TryGetProperty("violated-directive", out var value) && value.ValueKind == JsonValueKind.String)
            {
                var diretiva = (value.GetString() ?? "").Split(' ')[0];
                if (Regex.IsMatch(diretiva, "^[a-z-]{1,40}$")) logger.LogWarning("CSP: violação da diretiva {Diretiva}.", diretiva);
            }
        }
        catch (JsonException) { }
        // Não gravar corpo, URL, parâmetros, fragmentos ou trechos de scripts enviados pelo navegador.
        return NoContent();
    }
}
