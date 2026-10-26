using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Infrastructure.Configurations;
using TicketApp.Infrastructure.Helpers;

namespace TicketApp.Infrastructure.Services;

public class BrevoEmailService : IEmailService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly BrevoSettings _settings;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BrevoEmailService> _logger;

    public BrevoEmailService(
        IHttpClientFactory httpClientFactory,
        IOptions<BrevoSettings> settings,
        IConfiguration configuration,
        ILogger<BrevoEmailService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var apiKey = ConfigurationHelper.ResolveEnvValue(_settings.ApiKey, "BREVO_API_KEY");
        var senderEmail = ConfigurationHelper.ResolveEnvValue(_settings.SenderEmail, "BREVO_SENDER_EMAIL");
        var senderName = ConfigurationHelper.ResolveEnvValue(_settings.SenderName, "BREVO_SENDER_NAME");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Brevo API Key no configurada. Omitiendo envío a {To}", to);
            return false;
        }

        if (string.IsNullOrWhiteSpace(senderEmail))
        {
            _logger.LogWarning("Brevo SenderEmail no configurado. Omitiendo envío a {To}", to);
            return false;
        }

        try
        {
            var client = _httpClientFactory.CreateClient("BrevoClient");
            client.Timeout = TimeSpan.FromSeconds(10); // Evitar que una lentitud externa cuelgue peticiones

            var payload = new BrevoSendEmailRequest
            {
                Sender = new BrevoContact { Name = senderName, Email = senderEmail },
                To = new List<BrevoContact> { new BrevoContact { Email = to } },
                Subject = subject,
                HtmlContent = htmlBody
            };

            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            request.Headers.Add("api-key", apiKey);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await client.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Correo enviado exitosamente vía Brevo API a {To} con asunto '{Subject}'", to, subject);
                return true;
            }

            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Error en Brevo API (HTTP {StatusCode}): {ErrorContent}", response.StatusCode, errorContent);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción al enviar correo mediante Brevo API a {To}", to);
            return false;
        }
    }

    public async Task<bool> SendTemplateEmailAsync(
        string to,
        string subject,
        string templateName,
        IDictionary<string, string> replacements,
        CancellationToken cancellationToken = default)
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
                    var sourcePath = Path.Combine(projectDir, "TicketApp.Infrastructure", "Templates", "Email", $"{templateName}.html");
                    if (File.Exists(sourcePath))
                        templatePath = sourcePath;
                }
            }

            if (!File.Exists(templatePath))
            {
                _logger.LogError("Plantilla de correo '{TemplateName}' no encontrada en ruta: {Path}", templateName, templatePath);
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
            _logger.LogError(ex, "Error al procesar plantilla de correo {TemplateName} para {To}", templateName, to);
            return false;
        }
    }

    public string GetFrontendUrl()
    {
        return ConfigurationHelper.ResolveEnvValue(
            _configuration["FrontendUrl"] ?? "http://localhost:5173",
            "FRONTEND_URL"
        );
    }

    private class BrevoSendEmailRequest
    {
        [JsonPropertyName("sender")]
        public BrevoContact Sender { get; set; } = new();

        [JsonPropertyName("to")]
        public List<BrevoContact> To { get; set; } = new();

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = string.Empty;

        [JsonPropertyName("htmlContent")]
        public string HtmlContent { get; set; } = string.Empty;
    }

    private class BrevoContact
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
    }
}
