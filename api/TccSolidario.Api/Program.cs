using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Services; 
using TccSolidario.Api.Data; 
using TccSolidario.Api.Data.Seeding;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TccSolidario.Api.Middlewares;
using TccSolidario.Api.Services.Auth;
using TccSolidario.Api.Models;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Railway termina o HTTPS no proxy e encaminha HTTP para a porta do container.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    if (!int.TryParse(port, out var numeroPorta) || numeroPorta is < 1 or > 65535)
        throw new InvalidOperationException("PORT deve ser uma porta TCP válida.");
    builder.WebHost.UseUrls($"http://0.0.0.0:{numeroPorta}");
}

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
// Sem credenciais do Cloudinary, o ImagemUploadService grava as fotos em wwwroot/uploads.
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
builder.Services.AddScoped<ImagemUploadService>();
builder.Services.AddScoped<ContaService>();
builder.Services.AddScoped<ImpactoService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHostedService<ExpiracaoReservasWorker>();

// Ativa o cache de memória nativo do .NET
builder.Services.AddMemoryCache(); 

// Registra o serviço como Singleton (única instância para compartilhar a lista negra)
builder.Services.AddSingleton<ILogoutService, LogoutService>();

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
    throw new InvalidOperationException("Configure Jwt__Key no ambiente da aplicação.");
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
        OnTokenValidated = async validation =>
        {
            var id = validation.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var db = validation.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var usuario = Guid.TryParse(id, out var usuarioId)
                ? await db.Usuarios.AsNoTracking().SingleOrDefaultAsync(u => u.Id == usuarioId) : null;
            if (usuario is null || !RegrasAcesso.PodeAcessar(usuario))
                validation.Fail("Cadastro sem autorização para operar.");
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
        // O deploy integrado usa o mesmo domínio; CORS só é necessário para outro frontend.
        if (origins.Length > 0)
            policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Em produção, o domínio Railway fornece HTTPS; o container recebe HTTP interno.
if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseMiddleware<ExceptionMiddleware>();

app.UseCors("Frontend");
app.UseDefaultFiles();
app.UseStaticFiles(); 

app.UseAuthentication();

app.UseMiddleware<TccSolidario.Api.Middlewares.TokenBlacklistMiddleware>();

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

        // Compatibilidade pontual com administradores antigos: admin/99 -> Admin.
        // O login consulta a base Usuario e falha antes de verificar a senha se
        // encontrar um discriminador desconhecido. Não depende de seed/migrations.
        var adminsNormalizados = await NormalizacaoAdminLegado.ExecutarAsync(context);
        if (adminsNormalizados > 0)
            app.Logger.LogInformation("Identificadores de {Quantidade} administrador(es) legado(s) normalizados.", adminsNormalizados);

        // Criação do primeiro administrador somente quando habilitada.
        if (config.GetValue("Database:SeedAdmin", app.Environment.IsDevelopment()))
            DbInitializer.Initialize(context, config);

        // Usuários e alimentos de teste (somente local). Recriar: dotnet run -- --reset-dados-teste
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

