using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Resend;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Infrastructure.Helpers;

namespace TicketApp.Infrastructure.Services;

public class ResendEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ResendEmailService> _logger;
    private readonly string _apiKey;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public ResendEmailService(IConfiguration configuration, ILogger<ResendEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        // Si en appsettings viene el nombre de la variable de entorno (ej: "RESEND_API_KEY"), la resuelve
        _apiKey = ConfigurationHelper.ResolveEnvValue(_configuration["Resend:ApiKey"], "");
        _fromEmail = ConfigurationHelper.ResolveEnvValue(_configuration["Resend:FromEmail"], "onboarding@resend.dev");
        _fromName = ConfigurationHelper.ResolveEnvValue(_configuration["Resend:FromName"], "TicketApp Soporte");
    }

    public string GetFrontendUrl()
    {
        var rawUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        return ConfigurationHelper.ResolveEnvValue(rawUrl, rawUrl);
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning("Resend API Key no está configurada (RESEND_API_KEY). Omitiendo envío a {To}", to);
            return false;
        }

        try
        {
            IResend resend = ResendClient.Create(_apiKey);

            var message = new EmailMessage
            {
                From = $"{_fromName} <{_fromEmail}>",
                To = to,
                Subject = subject,
                HtmlBody = htmlBody
            };

            var response = await resend.EmailSendAsync(message, cancellationToken);
            _logger.LogInformation("Correo enviado exitosamente a {To} con Subject '{Subject}'. Status: {Success}", to, subject, response.Success);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar correo electrónico vía Resend a {To}", to);
            return false;
        }
    }

    public async Task<bool> SendTemplateEmailAsync(string to, string subject, string templateName, IDictionary<string, string> replacements, CancellationToken cancellationToken = default)
    {
        try
        {
            // Ruta de plantillas dentro de Infrastructure/Templates/Email o AppContext
            var baseDir = AppContext.BaseDirectory;
            var templatePath = Path.Combine(baseDir, "Templates", "Email", $"{templateName}.html");

            if (!File.Exists(templatePath))
            {
                // Fallback a ruta de proyecto si se corre en debug
                var projectDir = Directory.GetCurrentDirectory();
                var fallbackPath = Path.Combine(projectDir, "..", "TicketApp.Infrastructure", "Templates", "Email", $"{templateName}.html");
                if (File.Exists(fallbackPath))
                {
                    templatePath = fallbackPath;
                }
                else
                {
                    var directPath = Path.Combine(projectDir, "Templates", "Email", $"{templateName}.html");
                    if (File.Exists(directPath))
                    {
                        templatePath = directPath;
                    }
                }
            }

            if (!File.Exists(templatePath))
            {
                _logger.LogError("Plantilla de correo no encontrada: {TemplateName} en ruta {Path}", templateName, templatePath);
                return false;
            }

            var htmlContent = await File.ReadAllTextAsync(templatePath, cancellationToken);

            foreach (var kvp in replacements)
            {
                htmlContent = htmlContent.Replace($"{{{{{kvp.Key}}}}}", kvp.Value);
            }

            return await SendEmailAsync(to, subject, htmlContent, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando plantilla de correo {TemplateName} para {To}", templateName, to);
            return false;
        }
    }
}
