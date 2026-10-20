using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Infrastructure.Context;
using TicketApp.Infrastructure.Repositories;
using TicketApp.Infrastructure.Services;
using TicketApp.Infrastructure.UnitOfWork;

namespace TicketApp.Infrastructure.Extensions;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Supabase / PostgreSQL Connection String
        // Checks EnvironmentVariableTarget.Process (Docker/Linux containers), EnvironmentVariableTarget.Machine (Windows host), configuration, or fallback
        var rawConnectionString = Environment.GetEnvironmentVariable("SUPABASE_DB", EnvironmentVariableTarget.Process)
            ?? Environment.GetEnvironmentVariable("SUPABASE_DB", EnvironmentVariableTarget.Machine)
            ?? Environment.GetEnvironmentVariable("SUPABASE_DB", EnvironmentVariableTarget.User)
            ?? configuration["SUPABASE_DB"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Database=ticketapp;Username=postgres;Password=postgres";

        var connectionString = NormalizePostgresConnectionString(rawConnectionString);

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork.UnitOfWork>();

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

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
