using TicketApp.Domain.Common;
using TicketApp.Domain.Enums;

namespace TicketApp.Domain.Entities;

public class Ticket : BaseEntity, IAggregateRoot
{
    public int Sequence { get; set; }
    public string Code { get; set; } = string.Empty; // e.g. #TK-1001
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "TI & Redes";
    public string? Subcategory { get; set; }
    public Priority Priority { get; set; } = Priority.Medium;
    public TicketStatus Status { get; set; } = TicketStatus.Pending;

    public int LocationId { get; set; }
    public int? LocationAreaId { get; set; }
    public int RequesterId { get; set; }
    public int? AssigneeId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime SlaDueAt { get; set; } = DateTime.UtcNow.AddHours(24);
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionSummary { get; set; }

    // Navigation
    public Location Location { get; set; } = null!;
    public LocationArea? LocationArea { get; set; }
    public User Requester { get; set; } = null!;
    public User? Assignee { get; set; }
    public ICollection<TicketActivity> Activities { get; set; } = new List<TicketActivity>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
