using TicketApp.Domain.Common;
using TicketApp.Domain.Enums;

namespace TicketApp.Domain.Entities;

public class User : BaseEntity, IAggregateRoot
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Requestor;
    public string Position { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string? AvatarUrl { get; set; }
    public UserPresence Presence { get; set; } = UserPresence.Online;
    public int? LocationId { get; set; }
    public int? DepartmentId { get; set; }
    public bool MustChangePassword { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Location? Location { get; set; }
    public Department? Department { get; set; }
    public ICollection<Ticket> RequestedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public ICollection<TicketActivity> Activities { get; set; } = new List<TicketActivity>();
    public ICollection<Attachment> UploadedAttachments { get; set; } = new List<Attachment>();
}
