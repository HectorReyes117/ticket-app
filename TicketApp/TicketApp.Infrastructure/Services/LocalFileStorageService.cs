using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using TicketApp.Application.Common.Interfaces;

namespace TicketApp.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LocalFileStorageService(IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor)
    {
        _env = env;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<(string fileUrl, string physicalPath)> SaveFileAsync(
        Stream fileStream, string fileName, string folder, CancellationToken cancellationToken = default)
    {
        var webRoot = _env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
        }

        var targetFolder = Path.Combine(webRoot, "uploads", folder);
        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        var extension = Path.GetExtension(fileName);
        var cleanFileName = Path.GetFileNameWithoutExtension(fileName)
            .Replace(" ", "_")
            .Replace("-", "_");

        var uniqueFileName = $"{Guid.NewGuid():N}_{cleanFileName}{extension}";
        var physicalPath = Path.Combine(targetFolder, uniqueFileName);

        using (var destStream = new FileStream(physicalPath, FileMode.Create))
        {
            await fileStream.CopyToAsync(destStream, cancellationToken);
        }

        // Guardar solo la ruta relativa en base de datos: /uploads/{folder}/{uniqueFileName}
        var fileUrl = $"/uploads/{folder}/{uniqueFileName}";

        return (fileUrl, physicalPath);
    }

    public Task DeleteFileAsync(string physicalPath, CancellationToken cancellationToken = default)
    {
        if (File.Exists(physicalPath))
        {
            try
            {
                File.Delete(physicalPath);
            }
            catch
            {
                // Silently ignore or log delete failures in practice
            }
        }

        return Task.CompletedTask;
    }
}
