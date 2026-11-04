namespace TccSolidario.Api.Services.Seguranca;

public static class ArmazenamentoImagens
{
    public static string? Volume(IConfiguration? config) => config?["Storage:PersistentDirectory"] ?? config?["RAILWAY_VOLUME_MOUNT_PATH"];
    public static bool CloudinaryCompleto(IConfiguration config) => new[] { "CloudName", "ApiKey", "ApiSecret" }.All(k => !string.IsNullOrWhiteSpace(config["Cloudinary:" + k]));
    public static string Raiz(IWebHostEnvironment env, IConfiguration? config)
    {
        var volume = Volume(config);
        return string.IsNullOrWhiteSpace(volume)
            ? Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads")
            : Path.Combine(Path.GetFullPath(volume), "uploads");
    }
    public static void Validar(IWebHostEnvironment env, IConfiguration config)
    {
        bool parcial = new[] { "CloudName", "ApiKey", "ApiSecret" }.Any(k => !string.IsNullOrWhiteSpace(config["Cloudinary:" + k]));
        if (parcial && !CloudinaryCompleto(config)) throw new InvalidOperationException("Preencha as três variáveis Cloudinary__CloudName, Cloudinary__ApiKey e Cloudinary__ApiSecret.");
        if (CloudinaryCompleto(config)) return;
        var volume = Volume(config);
        if (env.IsProduction() && (string.IsNullOrWhiteSpace(volume) || !Path.IsPathFullyQualified(volume) || !Directory.Exists(volume)))
            throw new InvalidOperationException("Em produção, configure Cloudinary ou um volume montado em Storage__PersistentDirectory/RAILWAY_VOLUME_MOUNT_PATH. O disco temporário não preserva imagens.");
        Directory.CreateDirectory(Raiz(env, config));
    }
}
