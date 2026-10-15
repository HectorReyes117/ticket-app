using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Domain.Entities;
using TicketApp.Domain.Enums;
using TicketApp.Infrastructure.Context;

namespace TicketApp.Infrastructure.Seeds;

public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher hasher)
    {
        // 1. Seed Departments
        if (!await context.Departments.AnyAsync())
        {
            var departments = new List<Department>
            {
                new() { Code = "#DEP-IT", Name = "Tecnología & Sistemas", IsActive = true },
                new() { Code = "#DEP-INF", Name = "Infraestructura & Redes", IsActive = true },
                new() { Code = "#DEP-ADM", Name = "Administración General", IsActive = true },
                new() { Code = "#DEP-DOC", Name = "Docencia & Académico", IsActive = true },
                new() { Code = "#DEP-FIN", Name = "Finanzas & Contabilidad", IsActive = true }
            };

            await context.Departments.AddRangeAsync(departments);
            await context.SaveChangesAsync();
        }

        // 2. Seed Locations and LocationAreas
        if (!await context.Locations.AnyAsync())
        {
            var central = new Location
            {
                Code = "#SED-001",
                Name = "Sede Central Universitaria",
                FacilityType = "Campus Principal",
                Address = "Av. 30 de Mayo esq. Luperón, Km 7 1/2",
                City = "Santo Domingo",
                PostalCode = "10101",
                Phone = "+1 (809) 555-0100",
                IsActive = true
            };

            central.Areas.Add(new LocationArea { Name = "Data Center Principal - Piso 2", FloorOrBlock = "Piso 2", IsActive = true });
            central.Areas.Add(new LocationArea { Name = "Laboratorio Informática 1 - Edif A", FloorOrBlock = "Edificio A", IsActive = true });
            central.Areas.Add(new LocationArea { Name = "Salón de Profesores - Edif C", FloorOrBlock = "Edificio C", IsActive = true });
            central.Areas.Add(new LocationArea { Name = "Oficinas Administrativas", FloorOrBlock = "Piso 1", IsActive = true });

            var norte = new Location
            {
                Code = "#SED-002",
                Name = "Campus Norte",
                FacilityType = "Extensión Regional",
                Address = "Autopista Duarte Km 14, Sector Los Prados",
                City = "Santiago",
                PostalCode = "51000",
                Phone = "+1 (809) 555-0200",
                IsActive = true
            };

            norte.Areas.Add(new LocationArea { Name = "Recepción y Mesa de Entrada", FloorOrBlock = "Planta Baja", IsActive = true });
            norte.Areas.Add(new LocationArea { Name = "Laboratorio Multimedia", FloorOrBlock = "Piso 2", IsActive = true });
            norte.Areas.Add(new LocationArea { Name = "Rack Principal de Distribución", FloorOrBlock = "Piso 1", IsActive = true });

            var este = new Location
            {
                Code = "#SED-003",
                Name = "Campus Este",
                FacilityType = "Centro de Capacitación",
                Address = "Av. Boulevard Turístico del Este",
                City = "Punta Cana",
                PostalCode = "23000",
                Phone = "+1 (809) 555-0300",
                IsActive = true
            };

            este.Areas.Add(new LocationArea { Name = "Auditorio Principal", FloorOrBlock = "Edificio Central", IsActive = true });
            este.Areas.Add(new LocationArea { Name = "Aulas Híbridas 1 a 4", FloorOrBlock = "Pabellón B", IsActive = true });

            await context.Locations.AddRangeAsync(central, norte, este);
            await context.SaveChangesAsync();
        }

        // 3. Seed Users
        if (!await context.Users.AnyAsync())
        {
            var deptIt = await context.Departments.FirstOrDefaultAsync(d => d.Code == "#DEP-IT");
            var deptAdm = await context.Departments.FirstOrDefaultAsync(d => d.Code == "#DEP-ADM");
            var locCentral = await context.Locations.FirstOrDefaultAsync(l => l.Code == "#SED-001");
            var locNorte = await context.Locations.FirstOrDefaultAsync(l => l.Code == "#SED-002");

            var defaultPassword = hasher.HashPassword("Admin123*");

            var admin = new User
            {
                EmployeeCode = "#EMP-001",
                Name = "Dr. Marcos Reyes",
                Email = "admin@ticketapp.com",
                PasswordHash = defaultPassword,
                Role = UserRole.Admin,
                Position = "Administrador Global de Sistemas",
                Phone = "+1 (809) 555-0101",
                Extension = "101",
                AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                Presence = UserPresence.Online,
                LocationId = locCentral?.Id,
                DepartmentId = deptIt?.Id,
                IsActive = true
            };

            var tech1 = new User
            {
                EmployeeCode = "#EMP-002",
                Name = "Ing. Ana Lucía Pérez",
                Email = "aperez@ticketapp.com",
                PasswordHash = defaultPassword,
                Role = UserRole.Technician,
                Position = "Especialista Sénior de Redes & Infraestructura",
                Phone = "+1 (809) 555-0102",
                Extension = "102",
                AvatarUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                Presence = UserPresence.Online,
                LocationId = locCentral?.Id,
                DepartmentId = deptIt?.Id,
                IsActive = true
            };

            var tech2 = new User
            {
                EmployeeCode = "#EMP-003",
                Name = "Roberto Tello",
                Email = "rtello@ticketapp.com",
                PasswordHash = defaultPassword,
                Role = UserRole.Technician,
                Position = "Técnico de Soporte en Sitio",
                Phone = "+1 (809) 555-0103",
                Extension = "103",
                AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                Presence = UserPresence.Busy,
                LocationId = locNorte?.Id,
                DepartmentId = deptIt?.Id,
                IsActive = true
            };

            var requestor = new User
            {
                EmployeeCode = "#EMP-004",
                Name = "Carlos Rivas",
                Email = "crivas@ticketapp.com",
                PasswordHash = defaultPassword,
                Role = UserRole.Requestor,
                Position = "Coordinador Académico",
                Phone = "+1 (809) 555-0104",
                Extension = "104",
                AvatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                Presence = UserPresence.Online,
                LocationId = locCentral?.Id,
                DepartmentId = deptAdm?.Id,
                IsActive = true
            };

            await context.Users.AddRangeAsync(admin, tech1, tech2, requestor);
            await context.SaveChangesAsync();

            // Set custodian for Central
            if (locCentral != null)
            {
                locCentral.CustodianId = admin.Id;
                await context.SaveChangesAsync();
            }
        }

        // 4. Seed Initial Demonstration Tickets
        if (!await context.Tickets.AnyAsync())
        {
            var requester = await context.Users.FirstOrDefaultAsync(u => u.Email == "crivas@ticketapp.com");
            var assignee = await context.Users.FirstOrDefaultAsync(u => u.Email == "aperez@ticketapp.com");
            var admin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@ticketapp.com");
            var loc = await context.Locations.Include(l => l.Areas).FirstOrDefaultAsync(l => l.Code == "#SED-001");

            if (requester != null && loc != null)
            {
                var area = loc.Areas.FirstOrDefault();

                var ticket1 = new Ticket
                {
                    Sequence = 1001,
                    Code = "#TK-1001",
                    Title = "Caída de enlace VPN y conexión inter-sedes",
                    Description = "Desde las 08:30 AM se reporta pérdida de conectividad intercampus con el enlace VPN de servidores perimetrales. Afecta el acceso al ERP financiero.",
                    Category = "TI & Redes",
                    Subcategory = "Conectividad & VPN",
                    Priority = Priority.Critical,
                    Status = TicketStatus.InProgress,
                    LocationId = loc.Id,
                    LocationAreaId = area?.Id,
                    RequesterId = requester.Id,
                    AssigneeId = assignee?.Id,
                    CreatedAt = DateTime.UtcNow.AddHours(-3),
                    UpdatedAt = DateTime.UtcNow.AddMinutes(-30),
                    SlaDueAt = DateTime.UtcNow.AddHours(4)
                };

                ticket1.Activities.Add(new TicketActivity
                {
                    AuthorId = requester.Id,
                    ActivityType = ActivityType.Created,
                    Message = "Incidencia reportada por el usuario con prioridad Crítica.",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddHours(-3)
                });

                if (assignee != null)
                {
                    ticket1.Activities.Add(new TicketActivity
                    {
                        AuthorId = admin?.Id ?? requester.Id,
                        ActivityType = ActivityType.Assignment,
                        Message = $"Asignado a {assignee.Name} para diagnóstico urgente en switches de borde.",
                        IsPublic = true,
                        CreatedAt = DateTime.UtcNow.AddHours(-2)
                    });

                    ticket1.Activities.Add(new TicketActivity
                    {
                        AuthorId = assignee.Id,
                        ActivityType = ActivityType.Note,
                        Message = "Verificado reinicio de interfaz en túnel IPsec. Enlace restablecido al 80%, monitorizando latencia.",
                        IsPublic = false, // Private technician note
                        CreatedAt = DateTime.UtcNow.AddMinutes(-40)
                    });
                }

                var ticket2 = new Ticket
                {
                    Sequence = 1002,
                    Code = "#TK-1002",
                    Title = "Falla de sincronización en estación biométrica",
                    Description = "El lector biométrico de acceso de personal no registra las marcaciones en la base de datos.",
                    Category = "Infraestructura",
                    Subcategory = "Acceso & Seguridad",
                    Priority = Priority.High,
                    Status = TicketStatus.Pending,
                    LocationId = loc.Id,
                    LocationAreaId = area?.Id,
                    RequesterId = requester.Id,
                    AssigneeId = null,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-50),
                    UpdatedAt = DateTime.UtcNow.AddMinutes(-50),
                    SlaDueAt = DateTime.UtcNow.AddHours(12)
                };

                ticket2.Activities.Add(new TicketActivity
                {
                    AuthorId = requester.Id,
                    ActivityType = ActivityType.Created,
                    Message = "Solicitud ingresada y en espera de asignación técnica.",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-50)
                });

                await context.Tickets.AddRangeAsync(ticket1, ticket2);
                await context.SaveChangesAsync();
            }
        }
    }
}
