using TicketApp.Domain.Common;

namespace TicketApp.Domain.Entities;

public class Location : BaseEntity, IAggregateRoot
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FacilityType { get; set; } = "Campus Principal";
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? IpGuardExtension { get; set; }
    public string? SecurityNotes { get; set; }
    public string? EstimatedStaffCapacity { get; set; }
    public string? AvailableFloors { get; set; }
    public int? CustodianId { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public User? Custodian { get; set; }
    public ICollection<LocationArea> Areas { get; set; } = new List<LocationArea>();
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
