using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketApp.Domain.Entities;

namespace TicketApp.Infrastructure.Configurations;

public class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> builder)
    {
        builder.ToTable("Locations");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(l => l.Code)
            .IsUnique();

        builder.Property(l => l.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(l => l.FacilityType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(l => l.Address)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(l => l.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(l => l.PostalCode)
            .HasMaxLength(20);

        builder.Property(l => l.Phone)
            .IsRequired()
            .HasMaxLength(25);

        builder.Property(l => l.IpGuardExtension)
            .HasMaxLength(50);

        builder.Property(l => l.SecurityNotes)
            .HasMaxLength(1000);

        builder.Property(l => l.EstimatedStaffCapacity)
            .HasMaxLength(100);

        builder.Property(l => l.AvailableFloors)
            .HasMaxLength(250);

        builder.Property(l => l.IsActive)
            .HasDefaultValue(true);

        builder.HasOne(l => l.Custodian)
            .WithMany()
            .HasForeignKey(l => l.CustodianId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(l => l.Areas)
            .WithOne(a => a.Location)
            .HasForeignKey(a => a.LocationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
