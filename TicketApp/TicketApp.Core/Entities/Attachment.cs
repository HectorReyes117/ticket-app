using TicketApp.Domain.Common;

namespace TicketApp.Domain.Entities;

public class Attachment : BaseEntity
{
    public int TicketId { get; set; }
    public int UploadedById { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty; // Public API route
    public string PhysicalPath { get; set; } = string.Empty; // Disk path on server
    public long FileSize { get; set; }
    public string MimeType { get; set; } = "application/octet-stream";
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Ticket Ticket { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}
