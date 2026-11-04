using System.Xml.Linq;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.DataProtection.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Services.Seguranca;

public sealed class RepositorioChaves(IServiceScopeFactory scopes, ProtecaoSegredos protecao) : IXmlRepository
{
    public IReadOnlyCollection<XElement> GetAllElements()
    {
        using var scope = scopes.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return db.ChavesProtecao.AsNoTracking().AsEnumerable().Select(c => XElement.Parse(protecao.Desproteger(c.XmlProtegido, "data-protection:" + c.Id))).ToArray();
    }
    public void StoreElement(XElement element, string friendlyName)
    {
        using var scope = scopes.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var chave = new ChaveProtecao(); chave.XmlProtegido = protecao.Proteger(element.ToString(SaveOptions.DisableFormatting), "data-protection:" + chave.Id);
        db.ChavesProtecao.Add(chave); db.SaveChanges();
    }
}
public sealed class ConfigurarChaves(RepositorioChaves repositorio) : IConfigureOptions<KeyManagementOptions>
{
    public void Configure(KeyManagementOptions options) => options.XmlRepository = repositorio;
}
