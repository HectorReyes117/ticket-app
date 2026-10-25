using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Infrastructure.Configurations;
using TicketApp.Infrastructure.Context;
using TicketApp.Infrastructure.Helpers;
using TicketApp.Infrastructure.Repositories;
using TicketApp.Infrastructure.Services;
using TicketApp.Infrastructure.UnitOfWork;

namespace TicketApp.Infrastructure.Extensions;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configuración fuertemente tipada de SMTP (MailKit)
        services.Configure<SmtpSettings>(configuration.GetSection(SmtpSettings.SectionName));

        // 1. Obtener la clave configurada en ConnectionStrings:DefaultConnection
        var configuredConn = configuration.GetConnectionString("DefaultConnection") 
                             ?? configuration["SUPABASE_DB"] 
                             ?? "SUPABASE_DB";

        // 2. Si configuredConn apunta a una variable de entorno (ej: "SUPABASE_DB"), resolver su valor
        var rawConnectionString = ConfigurationHelper.ResolveEnvValue(configuredConn, configuredConn);

        var connectionString = NormalizePostgresConnectionString(rawConnectionString);

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork.UnitOfWork>();

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IEmailService, MailKitEmailService>();

        return services;
    }

    private static string NormalizePostgresConnectionString(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return connectionString;

        var trimmed = connectionString.Trim();

        // If it comes in URI format like postgresql://user:pass@host:port/dbname
        if (trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(trimmed);
                var userInfo = uri.UserInfo.Split(':', 2);
                var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
                var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(database))
                    database = "postgres";

                return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
            }
            catch
            {
                // If URI parsing fails, return as-is
                return trimmed;
            }
        }

        return trimmed;
    }
}
