using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.Services; // <-- Esta linha resolve o erro do CNPJ
using TccSolidario.Api.Data; // <-- Garante que ele ache o AppDbContext
using TccSolidario.Api.Data.Seeding;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(); 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddHttpClient<ICnpjValidatorService, CnpjValidatorService>(client =>
{
    // Colocamos um "cracha" para a BrasilAPI saber que somos uma aplicacao legitima
    client.DefaultRequestHeaders.Add("User-Agent", "TccSolidarioApp/1.0");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var config = services.GetRequiredService<IConfiguration>();
        
        // Aplica migrações pendentes automaticamente (opcional, mas bom para Docker/Deploy)
        context.Database.Migrate();

        // Chama o nosso semeador
        DbInitializer.Initialize(context, config);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocorreu um erro ao semear o banco de dados.");
    }
}

app.Run();

