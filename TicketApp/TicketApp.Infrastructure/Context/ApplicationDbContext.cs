using System.Reflection;
using Microsoft.EntityFrameworkCore;
using TicketApp.Domain.Entities;

namespace TicketApp.Infrastructure.Context;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<LocationArea> LocationAreas => Set<LocationArea>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketActivity> TicketActivities => Set<TicketActivity>();
    public DbSet<Attachment> Attachments => Set<Attachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all IEntityTypeConfiguration implementations in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
