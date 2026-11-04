using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Services;
using TccSolidario.Api.Data;
using TccSolidario.Api.Data.Seeding;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TccSolidario.Api.Middlewares;
using Microsoft.Extensions.FileProviders;
using TccSolidario.Api.Models;
using System.Security.Claims;
using TccSolidario.Api.Services.Seguranca;
using TccSolidario.Api.Controllers;

var builder = WebApplication.CreateBuilder(args);

// Railway termina o HTTPS no proxy e encaminha HTTP para a porta do container.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    if (!int.TryParse(port, out var numeroPorta) || numeroPorta is < 1 or > 65535)
        throw new InvalidOperationException("PORT deve ser uma porta TCP vÃ¡lida.");
    builder.WebHost.UseUrls($"http://0.0.0.0:{numeroPorta}");
}

builder.Services.AdicionarSeguranca(builder.Configuration, builder.Environment);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.AspNetCore.Hosting.Diagnostics", LogLevel.Warning);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TCC Solidario API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Cole o seu token JWT aqui."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddScoped<ICnpjValidatorService, CnpjValidatorService>();
builder.Services.AddScoped<ICpfValidatorService, CpfValidatorService>();
builder.Services.AddScoped<IUsuarioRegistrationService, UsuarioRegistrationService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddHostedService<VerificacaoValidadeProdutosWorker>();
builder.Services.AddScoped<INotificacaoService, NotificacaoService>();
builder.Services.AddScoped<IReservaService, ReservaService>();
builder.Services.AddScoped<CicloVidaService>();
// Imagens de produção exigem Cloudinary ou volume persistente configurado.
var cloudinarySection = builder.Configuration.GetSection("Cloudinary");
if (!string.IsNullOrWhiteSpace(cloudinarySection["CloudName"])
    && !string.IsNullOrWhiteSpace(cloudinarySection["ApiKey"])
    && !string.IsNullOrWhiteSpace(cloudinarySection["ApiSecret"]))
{
    var cloudinary = new CloudinaryDotNet.Cloudinary(new CloudinaryDotNet.Account(
        cloudinarySection["CloudName"], cloudinarySection["ApiKey"], cloudinarySection["ApiSecret"]));
    cloudinary.Api.Secure = true;
    builder.Services.AddSingleton(cloudinary);
}
ArmazenamentoImagens.Validar(builder.Environment, builder.Configuration);
builder.Services.AddScoped<ImagemUploadService>();
builder.Services.AddScoped<ContaService>();
builder.Services.AddScoped<ImpactoService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHostedService<ExpiracaoReservasWorker>();

// Ativa o cache de memÃ³ria nativo do .NET
builder.Services.AddMemoryCache();

// Registra o serviÃ§o como Singleton (Ãºnica instÃ¢ncia para compartilhar a lista negra)
// SessÃµes e revogaÃ§Ãµes sÃ£o persistidas no banco.

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Configure ConnectionStrings__DefaultConnection.");
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));


builder.Services.AddHttpClient<ICnpjValidatorService, CnpjValidatorService>(client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "TccSolidarioApp/1.0");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Configuracao do JWT
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("Configure Jwt__Key no ambiente da aplicaÃ§Ã£o.");
}

if (builder.Environment.IsProduction()
    && (Encoding.UTF8.GetByteCount(jwtKey) < 32
        || string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Issuer"])
        || string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Audience"])))
    throw new InvalidOperationException("Configure Jwt__Key com pelo menos 32 bytes, Jwt__Issuer e Jwt__Audience.");

var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = received =>
        {
            received.Token = received.Request.Cookies[AuthController.CookieNome(builder.Environment.IsProduction())];
            return Task.CompletedTask;
        },
        OnTokenValidated = async validation =>
        {
            var id = validation.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var db = validation.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var usuario = Guid.TryParse(id, out var usuarioId)
                ? await db.Usuarios.AsNoTracking().SingleOrDefaultAsync(u => u.Id == usuarioId) : null;
            var sid = validation.Principal?.FindFirstValue("vfsid");
            var versao = validation.Principal?.FindFirstValue("vfsv");
            var sessao = Guid.TryParse(sid, out var sessaoId)
                ? await db.SessoesAutenticacao.AsNoTracking().SingleOrDefaultAsync(s => s.Id == sessaoId) : null;
            var agora = validation.HttpContext.RequestServices.GetRequiredService<TimeProvider>().GetUtcNow().UtcDateTime;
            if (usuario is null || !RegrasAcesso.PodeAcessar(usuario) || !usuario.EmailConfirmado
                || (usuario.Tipo == TccSolidario.Api.Models.Enums.TipoUsuario.Admin && !usuario.MfaAtivo)
                || sessao is null || sessao.UsuarioId != usuario.Id || sessao.RevogadaEmUtc.HasValue || sessao.ExpiraEmUtc <= agora
                || versao != usuario.VersaoSeguranca.ToString() || sessao.VersaoUsuario != usuario.VersaoSeguranca
                || validation.Principal?.FindFirstValue(ClaimTypes.Role) != usuario.Tipo.ToString())
                validation.Fail("SessÃ£o expirada ou revogada.");
        }
    };
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true, // Verifica se o token expirou
        ClockSkew = TimeSpan.Zero // Remove o tempo de tolerancia de 5 min do .NET
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? (builder.Environment.IsDevelopment() ? ["http://localhost:5173"] : []);
        // O deploy integrado usa o mesmo domÃ­nio; CORS sÃ³ Ã© necessÃ¡rio para outro frontend.
        if (origins.Length > 0)
            policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

var app = builder.Build();
_ = app.Services.GetRequiredService<ProtecaoSegredos>();
app.Services.GetRequiredService<SmtpEnvioEmail>().ValidarConfiguracao();
using (var validacao = app.Services.CreateScope())
    _ = validacao.ServiceProvider.GetRequiredService<EmailService>().OrigemPublica();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Em produÃ§Ã£o, o domÃ­nio Railway fornece HTTPS; o container recebe HTTP interno.
if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseForwardedHeaders();
app.Use(async (ctx, next) =>
{
    if (app.Environment.IsProduction() && builder.Configuration.GetValue("Proxy:HttpsTermination", false))
        ctx.Request.Scheme = "https";
    ConfiguracaoSeguranca.Cabecalhos(ctx, builder.Configuration, app.Environment);
    await next(ctx);
});
app.UseMiddleware<ExceptionMiddleware>();

app.UseCors("Frontend");
app.UseDefaultFiles();
app.UseStaticFiles();
if (!string.IsNullOrWhiteSpace(ArmazenamentoImagens.Volume(builder.Configuration)))
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(ArmazenamentoImagens.Raiz(app.Environment, builder.Configuration)), RequestPath = "/uploads" });

app.UseRouting();
app.UseAuthentication();

app.UseRateLimiter();
app.UseMiddleware<CsrfMiddleware>();

app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", async (AppDbContext db, CancellationToken ct) =>
{
    try
    {
        return await db.Database.CanConnectAsync(ct)
            ? Results.Ok(new { status = "ok" })
            : Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }
    catch
    {
        return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }
}).AllowAnonymous();
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/health/ready", async (AppDbContext db, EstadoOperacao estado, CancellationToken ct) =>
{
    try { return await db.Database.CanConnectAsync(ct) && estado.Saudavel ? Results.Ok(new { status = "ok" }) : Results.StatusCode(503); }
    catch { return Results.StatusCode(503); }
}).AllowAnonymous();
// Uma rota de API inexistente continua retornando 404, sem receber o HTML do React.
app.Map("/api/{**path}", () => Results.NotFound());
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var config = services.GetRequiredService<IConfiguration>();

        if (builder.Configuration.GetValue("Database:AutoMigrate", app.Environment.IsDevelopment()))
            context.Database.Migrate();
        if (config.GetValue("Database:ValidateSchema", true) && (await context.Database.GetPendingMigrationsAsync()).Any())
            throw new InvalidOperationException("Existem migrations pendentes. Aplique-as com a credencial de manutenÃ§Ã£o antes de publicar esta versÃ£o.");

        // Compatibilidade pontual com administradores antigos: admin/99 -> Admin.
        // O login consulta a base Usuario e falha antes de verificar a senha se
        // encontrar um discriminador desconhecido. NÃ£o depende de seed/migrations.
        var adminsNormalizados = await NormalizacaoAdminLegado.ExecutarAsync(context);
        if (adminsNormalizados > 0)
            app.Logger.LogInformation("Identificadores de {Quantidade} administrador(es) legado(s) normalizados.", adminsNormalizados);

        // CriaÃ§Ã£o do primeiro administrador somente quando habilitada.
        if (config.GetValue("Database:SeedAdmin", app.Environment.IsDevelopment()))
            DbInitializer.Initialize(context, config);

        // UsuÃ¡rios e alimentos de teste (somente local). Recriar: dotnet run -- --reset-dados-teste
        if (app.Environment.IsDevelopment() && config.GetValue("DadosTeste:Ativo", true))
            DadosTesteSeeder.Executar(context, args.Contains("--reset-dados-teste"));
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocorreu um erro ao preparar o banco de dados.");
        if (app.Environment.IsProduction()) throw;
    }
}

app.Run();
