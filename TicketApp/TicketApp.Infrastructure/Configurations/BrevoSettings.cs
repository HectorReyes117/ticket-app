namespace TicketApp.Infrastructure.Configurations;

public class BrevoSettings
{
    public const string SectionName = "BrevoSettings";

    public string ApiKey { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = "TicketApp Soporte";
}
