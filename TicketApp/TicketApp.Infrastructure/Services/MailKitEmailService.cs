using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Infrastructure.Configurations;
using TicketApp.Infrastructure.Helpers;

namespace TicketApp.Infrastructure.Services;

public class MailKitEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<MailKitEmailService> _logger;
    private readonly SmtpSettings _settings;

    public MailKitEmailService(
        IConfiguration configuration,
        IOptions<SmtpSettings> options,
        ILogger<MailKitEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _settings = options.Value;
    }

    public string GetFrontendUrl()
    {
        var rawUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        return ConfigurationHelper.ResolveEnvValue(rawUrl, rawUrl);
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var host = ConfigurationHelper.ResolveEnvValue(_settings.Host, "smtp.gmail.com");
        var portStr = ConfigurationHelper.ResolveEnvValue(_settings.Port.ToString(), "587");
        int.TryParse(portStr, out var port);
        if (port <= 0) port = 587;

        var userName = ConfigurationHelper.ResolveEnvValue(_settings.UserName, "");
        var rawPassword = ConfigurationHelper.ResolveEnvValue(_settings.Password, "");
        // Las contraseñas de aplicación de Google a veces vienen con espacios (ej: 'ujuw jlrm xtsc bngw'), los removemos
        var password = rawPassword.Replace(" ", "").Trim();
        var fromEmail = ConfigurationHelper.ResolveEnvValue(_settings.FromEmail, userName);
        var fromName = ConfigurationHelper.ResolveEnvValue(_settings.FromName, "TicketApp Soporte");

        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("Configuración SMTP incompleta (UserName o Password no definidos). Omitiendo envío de correo a {To}", to);
            return false;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            // Deshabilitar validación de certificados no válidos solo si se requiriera, pero por defecto mantenemos TLS seguro
            var secureSocketOptions = _settings.UseSsl 
                ? SecureSocketOptions.SslOnConnect 
                : (port == 587 ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);

            await client.ConnectAsync(host, port, secureSocketOptions, cancellationToken);
            await client.AuthenticateAsync(userName, password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Correo enviado exitosamente vía MailKit a {To} con Subject '{Subject}'", to, subject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar correo electrónico vía MailKit a {To}", to);
            return false;
        }
    }

    public async Task<bool> SendTemplateEmailAsync(string to, string subject, string templateName, IDictionary<string, string> replacements, CancellationToken cancellationToken = default)
    {
        try
        {
            var baseDir = AppContext.BaseDirectory;
            var templatePath = Path.Combine(baseDir, "Templates", "Email", $"{templateName}.html");

            if (!File.Exists(templatePath))
            {
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
