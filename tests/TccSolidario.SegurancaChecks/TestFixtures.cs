using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Data;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;

internal static class TestFixtures
{
    public static async Task SeedAsync(AppDbContext db)
    {
        foreach (var (email, tipo) in new[] { ("admin-web@example.invalid", TipoUsuario.Admin), ("loja-web@example.invalid", TipoUsuario.Varejista) })
        {
            var user = await db.Usuarios.SingleOrDefaultAsync(u => u.EmailNormalizado == email);
            if (user is null)
            {
                user = tipo == TipoUsuario.Admin ? new Admin { Email = email, Nome = "Admin Web Teste", Tipo = tipo }
                    : new Varejista { Email = email, Nome = "Loja Web Teste", NomeEstabelecimento = "Loja Web Teste", RazaoSocial = "Loja Web Teste", CNPJ = "11222333000181", Tipo = tipo };
                db.Add(user);
            }
            user.StatusAprovacao = StatusAprovacao.Aprovado; user.EmailConfirmado = true;
            user.SenhaHash = BCrypt.Net.BCrypt.HashPassword("Teste!42-SomenteFixture", 12);
            user.MfaAtivo = false; user.SegredoMfaProtegido = null; user.UltimoPassoMfa = -1; user.CodigosRecuperacaoMfa = "[]";
            user.VersaoSeguranca = Guid.NewGuid();
            await db.SaveChangesAsync();
        }
        await db.LimitesAutenticacao.ExecuteDeleteAsync(); // Banco é exclusivamente de testes locais, validado pelo programa.
        Console.WriteLine("Fixtures de navegador prontas no banco local isolado.");
    }
}
