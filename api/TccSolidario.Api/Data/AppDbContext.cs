using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        AtualizarVersoes();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        AtualizarVersoes();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void AtualizarVersoes()
    {
        foreach (var entry in ChangeTracker.Entries<Produto>().Where(e => e.State == EntityState.Modified))
            entry.Entity.Versao = Guid.NewGuid();
        foreach (var entry in ChangeTracker.Entries<Transacao>().Where(e => e.State == EntityState.Modified))
            entry.Entity.Versao = Guid.NewGuid();
    }

    // --- Tabelas (DbSets) ---

    // Hierarquia de Usuários (TPH - Vai virar uma tabela 'Usuarios' com coluna Discriminator)
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Varejista> Varejistas { get; set; }
    public DbSet<Ong> Ongs { get; set; }
    public DbSet<Consumidor> Consumidores { get; set; }
    public DbSet<Admin> Admins { get; set; }

    // Entidades de Apoio
    public DbSet<Endereco> Enderecos { get; set; }

    // Core do Negócio
    public DbSet<Produto> Produtos { get; set; }
    public DbSet<Transacao> Transacoes { get; set; }
    public DbSet<ProdutoImagem> ProdutoImagens { get; set; }

    // --- Configurações do Banco ---
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Transacao>().Property(t => t.StatusReserva).HasConversion<string>();
        modelBuilder.Entity<Transacao>().HasIndex(t => t.ProdutoId)
            .IsUnique().HasFilter("\"StatusReserva\" = 'Ativa'");
        modelBuilder.Entity<Transacao>().HasIndex(t => t.CodigoRetirada)
            .IsUnique().HasFilter("\"CodigoRetirada\" <> ''");
        modelBuilder.Entity<Transacao>().HasIndex(t => new { t.StatusReserva, t.DataExpiracao });
        modelBuilder.Entity<ProdutoImagem>().Property(i => i.Url).HasMaxLength(300).IsRequired();
        modelBuilder.Entity<ProdutoImagem>().HasIndex(i => new { i.ProdutoId, i.Ordem }).IsUnique();
        modelBuilder.Entity<Produto>().HasMany(p => p.Imagens).WithOne(i => i.Produto)
            .HasForeignKey(i => i.ProdutoId).OnDelete(DeleteBehavior.Cascade);

        // O EF vai criar uma coluna "TipoUsuarioString" para saber quem é quem
        modelBuilder.Entity<Usuario>()
            .HasDiscriminator<string>("TipoUsuarioString")
            .HasValue<Varejista>("Varejista")
            .HasValue<Ong>("Ong")
            .HasValue<Consumidor>("Consumidor")
            .HasValue<Admin>("Admin");

        // Varejista e ONG compartilham a mesma coluna de horário na tabela Usuarios
        modelBuilder.Entity<Varejista>().Property(v => v.HorarioFuncionamento).HasColumnName("HorarioFuncionamento");
        modelBuilder.Entity<Ong>().Property(o => o.HorarioFuncionamento).HasColumnName("HorarioFuncionamento");

        // 2. Configuração de Relacionamento Usuario -> Endereco
        // Se deletar o Usuario, deleta os endereços dele (Cascade)
        modelBuilder.Entity<Usuario>()
            .HasMany(u => u.Enderecos)
            .WithOne(e => e.Usuario)
            .HasForeignKey(e => e.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        // 3. Configuração de Precisão para Dinheiro 
        modelBuilder.Entity<Produto>()
            .Property(p => p.PrecoOriginal)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<Produto>()
            .Property(p => p.PrecoVenda)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<Transacao>()
            .Property(t => t.ValorFinal)
            .HasColumnType("decimal(18,2)");

        // 4. Configuração de Enums (Salvar como Texto para facilitar leitura no Banco)
        // Ex: Ao invés de salvar '1', salva 'EmDesconto'
        modelBuilder.Entity<Produto>()
            .Property(p => p.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Transacao>()
            .Property(t => t.Tipo)
            .HasConversion<string>();
            
        modelBuilder.Entity<Usuario>()
             .Property(u => u.Tipo)
             .HasConversion<string>();
    }
}