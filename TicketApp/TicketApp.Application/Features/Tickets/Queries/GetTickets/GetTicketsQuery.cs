using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Tickets.DTOs;
using TicketApp.Domain.Common;
using TicketApp.Domain.Entities;
using TicketApp.Domain.Enums;

namespace TicketApp.Application.Features.Tickets.Queries.GetTickets;

public class GetTicketsQuery : IRequest<ApiResponse<PagedResult<TicketSummaryDto>>>
{
    public string? Search { get; set; }
    public string? Tab { get; set; } = "all"; // all, assigned, unassigned, urgent, closed
    public TicketStatus? Status { get; set; }
    public Priority? Priority { get; set; }
    public int? LocationId { get; set; }
    public int? AssigneeId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetTicketsQueryHandler : IRequestHandler<GetTicketsQuery, ApiResponse<PagedResult<TicketSummaryDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetTicketsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<PagedResult<TicketSummaryDto>>> Handle(GetTicketsQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Repository<Ticket>()
            .Query()
            .Include(t => t.Location)
            .Include(t => t.Requester)
            .Include(t => t.Assignee)
            .AsNoTracking();

        // Role-based visibility
        var currentUserId = _currentUserService.UserId;
        var currentRole = _currentUserService.Role?.ToLower();

        if (currentRole == "requestor" && currentUserId.HasValue)
        {
            query = query.Where(t => t.RequesterId == currentUserId.Value);
        }
        else if (currentRole == "technician" && currentUserId.HasValue)
        {
            query = query.Where(t => t.AssigneeId == currentUserId.Value);
        }

        // Tab filters
        if (!string.IsNullOrWhiteSpace(request.Tab))
        {
            switch (request.Tab.ToLower())
            {
                case "assigned":
                    if (currentUserId.HasValue)
                        query = query.Where(t => t.AssigneeId == currentUserId.Value && t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Cancelled);
                    else
                        query = query.Where(t => t.AssigneeId != null && t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Cancelled);
                    break;
                case "unassigned":
                    query = query.Where(t => t.AssigneeId == null && t.Status == TicketStatus.Pending);
                    break;
                case "urgent":
                    query = query.Where(t => t.Priority == Priority.Critical && t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Cancelled);
                    break;
                case "closed":
                    query = query.Where(t => t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Cancelled);
                    break;
            }
        }

        // Custom filters
        if (request.Status.HasValue)
            query = query.Where(t => t.Status == request.Status.Value);

        if (request.Priority.HasValue)
            query = query.Where(t => t.Priority == request.Priority.Value);

        if (request.LocationId.HasValue && request.LocationId.Value > 0)
            query = query.Where(t => t.LocationId == request.LocationId.Value);

        if (request.AssigneeId.HasValue && request.AssigneeId.Value > 0)
            query = query.Where(t => t.AssigneeId == request.AssigneeId.Value);

        // Text search
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(t =>
                t.Code.ToLower().Contains(search) ||
                t.Title.ToLower().Contains(search) ||
                t.Description.ToLower().Contains(search) ||
                t.Requester.Name.ToLower().Contains(search) ||
                (t.Assignee != null && t.Assignee.Name.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TicketSummaryDto
            {
                Id = t.Id,
                Sequence = t.Sequence,
                Code = t.Code,
                Title = t.Title,
                Category = t.Category,
                Priority = t.Priority.ToString().ToLower(),
                PriorityDescription = t.Priority.GetDescription(),
                Status = t.Status.ToString().ToLower(),
                StatusDescription = t.Status.GetDescription(),
                LocationId = t.LocationId,
                LocationName = t.Location.Name,
                RequesterId = t.RequesterId,
                RequesterName = t.Requester.Name,
                RequesterAvatarUrl = t.Requester.AvatarUrl,
                AssigneeId = t.AssigneeId,
                AssigneeName = t.Assignee != null ? t.Assignee.Name : null,
                AssigneeAvatarUrl = t.Assignee != null ? t.Assignee.AvatarUrl : null,
                CreatedAt = t.CreatedAt,
                SlaDueAt = t.SlaDueAt
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<TicketSummaryDto>(items, totalCount, pageNumber, pageSize);
        return ApiResponse<PagedResult<TicketSummaryDto>>.Ok(pagedResult);
    }
}
