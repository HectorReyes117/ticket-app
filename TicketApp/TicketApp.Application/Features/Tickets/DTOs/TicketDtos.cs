namespace TicketApp.Application.Features.Tickets.DTOs;

public class TicketDto
{
    public int Id { get; set; }
    public int Sequence { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Subcategory { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string PriorityDescription { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusDescription { get; set; } = string.Empty;

    public int LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public int? LocationAreaId { get; set; }
    public string? LocationAreaName { get; set; }

    public int RequesterId { get; set; }
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;
    public string? RequesterAvatarUrl { get; set; }

    public int? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public string? AssigneeEmail { get; set; }
    public string? AssigneeAvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime SlaDueAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionSummary { get; set; }

    public List<TicketActivityDto> Activities { get; set; } = new();
    public List<AttachmentDto> Attachments { get; set; } = new();
}

public class TicketSummaryDto
{
    public int Id { get; set; }
    public int Sequence { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string PriorityDescription { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusDescription { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public int RequesterId { get; set; }
    public string RequesterName { get; set; } = string.Empty;
    public string? RequesterAvatarUrl { get; set; }
    public int? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public string? AssigneeAvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime SlaDueAt { get; set; }
}

public class TicketActivityDto
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public int AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatarUrl { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string ActivityTypeDescription { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public string? PreviousValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AttachmentDto
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public int UploadedById { get; set; }
    public string UploadedByName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}
