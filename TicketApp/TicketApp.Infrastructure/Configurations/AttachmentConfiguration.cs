using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketApp.Domain.Entities;

namespace TicketApp.Infrastructure.Configurations;

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.ToTable("Attachments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(a => a.FileUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.PhysicalPath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.MimeType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.UploadedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(a => a.UploadedBy)
            .WithMany(u => u.UploadedAttachments)
            .HasForeignKey(a => a.UploadedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
