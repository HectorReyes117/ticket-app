using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Domain.Entities;
using TicketApp.Domain.Enums;

namespace TicketApp.Application.Features.Dashboard.DTOs;

public class DashboardKpiDto
{
    public int TotalTickets { get; set; }
    public double TotalTicketsTrendPercent { get; set; } = 12.5;

    public int PendingUnassignedTickets { get; set; }
    public int InProgressTickets { get; set; }
    public int ResolvedTicketsThisMonth { get; set; }
    public double ResolutionRatePercent { get; set; } = 94.8;
    public double AvgResolutionHours { get; set; } = 4.2;
}

public class SiteDistributionDto
{
    public int LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public int TicketCount { get; set; }
    public double Percentage { get; set; }
}

public class TechnicianLoadDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Presence { get; set; } = string.Empty;
    public int ActiveTicketsCount { get; set; }
}

public class DashboardDataDto
{
    public DashboardKpiDto Kpis { get; set; } = new();
    public List<SiteDistributionDto> SiteDistribution { get; set; } = new();
    public List<TechnicianLoadDto> TechnicianLoads { get; set; } = new();
}

public class GetDashboardDataQuery : IRequest<ApiResponse<DashboardDataDto>>
{
}

public class GetDashboardDataQueryHandler : IRequestHandler<GetDashboardDataQuery, ApiResponse<DashboardDataDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetDashboardDataQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<DashboardDataDto>> Handle(GetDashboardDataQuery request, CancellationToken cancellationToken)
    {
        var ticketsRepo = _unitOfWork.Repository<Ticket>().Query().AsNoTracking();
        var usersRepo = _unitOfWork.Repository<User>().Query().AsNoTracking();
        var locationsRepo = _unitOfWork.Repository<Location>().Query().AsNoTracking();

        var total = await ticketsRepo.CountAsync(cancellationToken);
        var pendingUnassigned = await ticketsRepo.CountAsync(t => t.AssigneeId == null && t.Status == TicketStatus.Pending, cancellationToken);
        var inProgress = await ticketsRepo.CountAsync(t => t.Status == TicketStatus.InProgress, cancellationToken);

        var firstDayOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var resolvedMonth = await ticketsRepo.CountAsync(t => t.Status == TicketStatus.Resolved && t.ResolvedAt >= firstDayOfMonth, cancellationToken);

        var kpi = new DashboardKpiDto
        {
            TotalTickets = total,
            TotalTicketsTrendPercent = 12.0,
            PendingUnassignedTickets = pendingUnassigned,
            InProgressTickets = inProgress,
            ResolvedTicketsThisMonth = resolvedMonth,
            ResolutionRatePercent = total > 0 ? Math.Round((double)resolvedMonth / total * 100, 1) : 0,
            AvgResolutionHours = 4.2
        };

        // Distribution by site
        var siteGroups = await ticketsRepo
            .GroupBy(t => new { t.LocationId, t.Location.Name })
            .Select(g => new { g.Key.LocationId, g.Key.Name, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var siteDistribution = siteGroups.Select(sg => new SiteDistributionDto
        {
            LocationId = sg.LocationId,
            LocationName = sg.Name,
            TicketCount = sg.Count,
            Percentage = total > 0 ? Math.Round((double)sg.Count / total * 100, 1) : 0
        }).ToList();

        // Technician load
        var technicians = await usersRepo
            .Where(u => u.Role == UserRole.Technician && u.IsActive)
            .Select(u => new TechnicianLoadDto
            {
                UserId = u.Id,
                Name = u.Name,
                Email = u.Email,
                AvatarUrl = u.AvatarUrl,
                Presence = u.Presence.ToString().ToLower(),
                ActiveTicketsCount = u.AssignedTickets.Count(t => t.Status == TicketStatus.InProgress || t.Status == TicketStatus.OnHold)
            })
            .ToListAsync(cancellationToken);

        var result = new DashboardDataDto
        {
            Kpis = kpi,
            SiteDistribution = siteDistribution,
            TechnicianLoads = technicians
        };

        return ApiResponse<DashboardDataDto>.Ok(result);
    }
}
