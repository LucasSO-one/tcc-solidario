using Microsoft.EntityFrameworkCore;

namespace TccSolidario.Api.Data.Seeding;

public static class NormalizacaoAdminLegado
{
    // SQL direto evita materializar o discriminador antigo, que o EF não reconhece.
    // 99 já representava Admin. Exige as duas marcações administrativas para não
    // converter cadastros de outros perfis. Preserva senha, chave e aprovação.
    public static Task<int> ExecutarAsync(AppDbContext context) =>
        context.Database.ExecuteSqlRawAsync("""
            UPDATE "Usuarios"
            SET "Tipo" = 'Admin', "TipoUsuarioString" = 'Admin'
            WHERE "TipoUsuarioString" = 'admin'
              AND "Tipo" IN ('99', 'Admin', 'admin')
            """);
}
