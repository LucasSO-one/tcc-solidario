using TccSolidario.Api.Models; 
using TccSolidario.Api.Models.Enums;

namespace TccSolidario.Api.Data.Seeding;
public static class DbInitializer
{
    public static void Initialize(AppDbContext context, IConfiguration configuration)
    {
        // 2. Verifica se já existe algum Admin
        if (context.Usuarios.Any(u => u.Tipo == TipoUsuario.Admin))
        {
            return; // O banco já foi semeado, não faz nada
        }

        // 3. Lê as credenciais do "ambiente" (appsettings ou secrets)
        var email = configuration["AdminSettings:Email"];
        var senha = configuration["AdminSettings:SenhaPadrao"];
        var nome = configuration["AdminSettings:Nome"];

        // 4. Cria o Admin
        var admin = new Admin
        {
            Nome = nome ?? "Admin Padrão",
            Email = email ?? "admin@admin.com",
            Tipo = TipoUsuario.Admin,
            SenhaHash = senha, // NOTA: Em produção, aqui você usaria BCrypt.HashPassword(senha)
            DataCriacao = DateTime.UtcNow
        };

        context.Usuarios.Add(admin);
        context.SaveChanges();
    }
}