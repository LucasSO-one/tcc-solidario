using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TccSolidario.Api.Data;

// Ferramentas de migrations não executam a inicialização nem carregam segredos de arquivos locais.
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args) => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") ?? "Host=localhost;Database=vittaflow_design;Username=design").Options);
}
