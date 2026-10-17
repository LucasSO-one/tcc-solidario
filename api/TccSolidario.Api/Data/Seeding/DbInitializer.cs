using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
namespace TccSolidario.Api.Data.Seeding;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context, IConfiguration configuration)
    {
        var existentes = context.Admins.ToList();
        if (existentes.Count > 0)
        {
            // O inicializador antigo podia gravar a senha em texto. Preserva a senha,
            // convertendo apenas a representação para BCrypt, sem redefini-la.
            foreach (var admin in existentes)
                if (!string.IsNullOrWhiteSpace(admin.SenhaHash) && !admin.SenhaHash.StartsWith("$2"))
                    admin.SenhaHash = BCrypt.Net.BCrypt.HashPassword(admin.SenhaHash);
            context.SaveChanges();
            return;
        }
        var email = configuration["AdminSettings:Email"];
        var senha = configuration["AdminSettings:SenhaPadrao"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(senha))
            throw new InvalidOperationException("Configure AdminSettings:Email e AdminSettings:SenhaPadrao para criar o primeiro administrador.");
        context.Admins.Add(new Admin
        {
            Nome = configuration["AdminSettings:Nome"] ?? "Administrador",
            Email = email,
            Tipo = TipoUsuario.Admin,
            StatusAprovacao = StatusAprovacao.Aprovado,
            SenhaHash = senha.StartsWith("$2") ? senha : BCrypt.Net.BCrypt.HashPassword(senha),
            DataCriacao = DateTime.UtcNow
        });
        context.SaveChanges();
    }
}
