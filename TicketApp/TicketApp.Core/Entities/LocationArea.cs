using TicketApp.Domain.Common;

namespace TicketApp.Domain.Entities;

public class LocationArea : BaseEntity
{
    public int LocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? FloorOrBlock { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Location Location { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
