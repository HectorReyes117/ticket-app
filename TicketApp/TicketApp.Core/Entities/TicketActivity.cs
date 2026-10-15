using TicketApp.Domain.Common;
using TicketApp.Domain.Enums;

namespace TicketApp.Domain.Entities;

public class TicketActivity : BaseEntity
{
    public int TicketId { get; set; }
    public int AuthorId { get; set; }
    public ActivityType ActivityType { get; set; } = ActivityType.Note;
    public string Message { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public string? PreviousValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Ticket Ticket { get; set; } = null!;
    public User Author { get; set; } = null!;
}
