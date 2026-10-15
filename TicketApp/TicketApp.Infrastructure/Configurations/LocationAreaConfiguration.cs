using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketApp.Domain.Entities;

namespace TicketApp.Infrastructure.Configurations;

public class LocationAreaConfiguration : IEntityTypeConfiguration<LocationArea>
{
    public void Configure(EntityTypeBuilder<LocationArea> builder)
    {
        builder.ToTable("LocationAreas");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(a => a.FloorOrBlock)
            .HasMaxLength(50);

        builder.Property(a => a.IsActive)
            .HasDefaultValue(true);
    }
}
