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
        var connectionString = Environment.GetEnvironmentVariable("SUPABASE_DB", EnvironmentVariableTarget.Process)
            ?? Environment.GetEnvironmentVariable("SUPABASE_DB", EnvironmentVariableTarget.Machine)
            ?? configuration["SUPABASE_DB"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Database=ticketapp;Username=postgres;Password=postgres";

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork.UnitOfWork>();

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        return services;
    }
}
