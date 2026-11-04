using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Models;

namespace TccSolidario.Api.Data;
public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor? http;
    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor? http = null) : base(options)
    {
        this.http = http;
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
        foreach (var entry in ChangeTracker.Entries<Usuario>().Where(e => e.State is EntityState.Added or EntityState.Modified))
        {
            entry.Entity.Email = Services.Seguranca.EmailNormalizado.Normalizar(entry.Entity.Email);
            entry.Entity.EmailNormalizado = entry.Entity.Email;
        }
        foreach (var entry in ChangeTracker.Entries<Produto>().Where(e => e.State == EntityState.Modified))
            entry.Entity.Versao = Guid.NewGuid();
        foreach (var entry in ChangeTracker.Entries<Transacao>().Where(e => e.State == EntityState.Modified))
            entry.Entity.Versao = Guid.NewGuid();
        Guid? ator = Guid.TryParse(http?.HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var atorId) ? atorId : null;
        var alteradas = ChangeTracker.Entries().Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .Where(e => e.Entity is Usuario or Produto or Transacao or Endereco).ToArray();
        foreach (var entry in alteradas)
            EventosAuditoria.Add(new EventoAuditoria { UsuarioId = ator, EntidadeId = entry.Property("Id").CurrentValue is Guid id ? id : null,
                Acao = entry.Entity.GetType().Name + "." + entry.State, EmUtc = DateTime.UtcNow });
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

    public DbSet<SessaoAutenticacao> SessoesAutenticacao { get; set; }
    public DbSet<TokenSeguranca> TokensSeguranca { get; set; }
    public DbSet<EmailPendente> EmailsPendentes { get; set; }
    public DbSet<EventoAuditoria> EventosAuditoria { get; set; }
    public DbSet<ChaveProtecao> ChavesProtecao { get; set; }
    public DbSet<LimiteAutenticacao> LimitesAutenticacao { get; set; }

    // --- Configurações do Banco ---
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Usuario>().Property(u => u.EmailNormalizado).HasMaxLength(254);
        modelBuilder.Entity<Usuario>().HasIndex(u => u.EmailNormalizado).IsUnique();
        modelBuilder.Entity<Usuario>().Property(u => u.CodigosRecuperacaoMfa).HasDefaultValue("[]").ValueGeneratedNever();
        modelBuilder.Entity<Usuario>().Property(u => u.EmailConfirmado).HasDefaultValue(true).ValueGeneratedNever();
        modelBuilder.Entity<Usuario>().Property(u => u.UltimoPassoMfa).HasDefaultValue(-1L).ValueGeneratedNever();
        modelBuilder.Entity<Usuario>().Property(u => u.VersaoSeguranca).HasDefaultValueSql("gen_random_uuid()");
        modelBuilder.Entity<SessaoAutenticacao>().HasIndex(s => new { s.UsuarioId, s.ExpiraEmUtc });
        modelBuilder.Entity<SessaoAutenticacao>().HasOne<Usuario>().WithMany().HasForeignKey(s => s.UsuarioId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TokenSeguranca>().HasIndex(t => new { t.UsuarioId, t.Finalidade });
        modelBuilder.Entity<TokenSeguranca>().HasOne<Usuario>().WithMany().HasForeignKey(t => t.UsuarioId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<EmailPendente>().HasIndex(e => new { e.EnviadoEmUtc, e.ProximaTentativaUtc });
        modelBuilder.Entity<EmailPendente>().HasOne<Usuario>().WithMany().HasForeignKey(e => e.UsuarioId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<EventoAuditoria>().HasIndex(e => e.EmUtc);
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