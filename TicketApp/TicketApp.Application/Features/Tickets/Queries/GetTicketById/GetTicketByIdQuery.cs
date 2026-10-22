using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Tickets.DTOs;
using TicketApp.Domain.Common;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Tickets.Queries.GetTicketById;

public class GetTicketByIdQuery : IRequest<ApiResponse<TicketDto>>
{
    public int Id { get; set; }

    public GetTicketByIdQuery(int id)
    {
        Id = id;
    }
}

public class GetTicketByIdQueryHandler : IRequestHandler<GetTicketByIdQuery, ApiResponse<TicketDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetTicketByIdQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<TicketDto>> Handle(GetTicketByIdQuery request, CancellationToken cancellationToken)
    {
        var ticket = await _unitOfWork.Repository<Ticket>()
            .Query()
            .Include(t => t.Location)
            .Include(t => t.LocationArea)
            .Include(t => t.Requester)
            .Include(t => t.Assignee)
            .Include(t => t.Activities).ThenInclude(a => a.Author)
            .Include(t => t.Attachments).ThenInclude(a => a.UploadedBy)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (ticket == null)
            throw new NotFoundException("Ticket", request.Id);

        var currentRole = _currentUserService.Role?.ToLower();
        var currentUserId = _currentUserService.UserId;

        // Security: Requestor can only view their own tickets; Technician can only view their assigned tickets
        if (currentRole == "requestor" && currentUserId.HasValue && ticket.RequesterId != currentUserId.Value)
        {
            throw new UnauthorizedException("No tiene permisos para acceder a esta solicitud.");
        }

        if (currentRole == "technician" && currentUserId.HasValue && ticket.AssigneeId != currentUserId.Value)
        {
            throw new UnauthorizedException("No tiene permisos para acceder a solicitudes que no le han sido asignadas.");
        }

        // Filter private activities if requester
        var activities = ticket.Activities.AsEnumerable();
        if (currentRole == "requestor")
        {
            activities = activities.Where(a => a.IsPublic);
        }

        var dto = new TicketDto
        {
            Id = ticket.Id,
            Sequence = ticket.Sequence,
            Code = ticket.Code,
            Title = ticket.Title,
            Description = ticket.Description,
            Category = ticket.Category,
            Subcategory = ticket.Subcategory,
            Priority = ticket.Priority.ToString().ToLower(),
            PriorityDescription = ticket.Priority.GetDescription(),
            Status = ticket.Status.ToString().ToLower(),
            StatusDescription = ticket.Status.GetDescription(),
            LocationId = ticket.LocationId,
            LocationName = ticket.Location?.Name ?? string.Empty,
            LocationAreaId = ticket.LocationAreaId,
            LocationAreaName = ticket.LocationArea?.Name,
            RequesterId = ticket.RequesterId,
            RequesterName = ticket.Requester?.Name ?? string.Empty,
            RequesterEmail = ticket.Requester?.Email ?? string.Empty,
            RequesterAvatarUrl = ticket.Requester?.AvatarUrl,
            AssigneeId = ticket.AssigneeId,
            AssigneeName = ticket.Assignee?.Name,
            AssigneeEmail = ticket.Assignee?.Email,
            AssigneeAvatarUrl = ticket.Assignee?.AvatarUrl,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            SlaDueAt = ticket.SlaDueAt,
            ResolvedAt = ticket.ResolvedAt,
            ResolutionSummary = ticket.ResolutionSummary,
            Activities = activities.OrderByDescending(a => a.CreatedAt).Select(a => new TicketActivityDto
            {
                Id = a.Id,
                TicketId = a.TicketId,
                AuthorId = a.AuthorId,
                AuthorName = a.Author?.Name ?? string.Empty,
                AuthorAvatarUrl = a.Author?.AvatarUrl,
                ActivityType = a.ActivityType.ToString().ToLower(),
                ActivityTypeDescription = a.ActivityType.GetDescription(),
                Message = a.Message,
                IsPublic = a.IsPublic,
                PreviousValue = a.PreviousValue,
                NewValue = a.NewValue,
                CreatedAt = a.CreatedAt
            }).ToList(),
            Attachments = ticket.Attachments.Select(a => new AttachmentDto
            {
                Id = a.Id,
                TicketId = a.TicketId,
                UploadedById = a.UploadedById,
                UploadedByName = a.UploadedBy?.Name ?? string.Empty,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileSize = a.FileSize,
                MimeType = a.MimeType,
                UploadedAt = a.UploadedAt
            }).ToList()
        };

        return ApiResponse<TicketDto>.Ok(dto);
    }
}
