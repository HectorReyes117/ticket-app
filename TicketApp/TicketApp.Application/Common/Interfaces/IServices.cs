using TicketApp.Domain.Entities;

namespace TicketApp.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Email { get; }
    string? Role { get; }
}

public interface IFileStorageService
{
    Task<(string fileUrl, string physicalPath)> SaveFileAsync(Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string physicalPath, CancellationToken cancellationToken = default);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
