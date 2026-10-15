using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Tickets.DTOs;
using TicketApp.Domain.Common;
using TicketApp.Domain.Entities;
using TicketApp.Domain.Enums;

namespace TicketApp.Application.Features.Tickets.Commands.AssignTicket;

public class AssignTicketCommand : IRequest<ApiResponse<TicketDto>>
{
    public int TicketId { get; set; }
    public int AssigneeId { get; set; }
}

public class AssignTicketValidation : AbstractValidator<AssignTicketCommand>
{
    public AssignTicketValidation()
    {
        RuleFor(x => x.TicketId).GreaterThan(0).WithMessage("ID de ticket inválido.");
        RuleFor(x => x.AssigneeId).GreaterThan(0).WithMessage("ID de técnico o especialista asignado inválido.");
    }
}

public class AssignTicketCommandHandler : IRequestHandler<AssignTicketCommand, ApiResponse<TicketDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public AssignTicketCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<TicketDto>> Handle(AssignTicketCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _unitOfWork.Repository<Ticket>()
            .Query()
            .Include(t => t.Location)
            .Include(t => t.LocationArea)
            .Include(t => t.Requester)
            .Include(t => t.Assignee)
            .Include(t => t.Activities).ThenInclude(a => a.Author)
            .Include(t => t.Attachments).ThenInclude(a => a.UploadedBy)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null)
            throw new NotFoundException("Ticket", request.TicketId);

        var newAssignee = await _unitOfWork.Repository<User>().GetByIdAsync(request.AssigneeId, cancellationToken);
        if (newAssignee == null)
            throw new NotFoundException("Usuario técnico", request.AssigneeId);

        var oldAssigneeName = ticket.Assignee?.Name ?? "Sin asignar";
        ticket.AssigneeId = request.AssigneeId;
        ticket.Assignee = newAssignee;
        ticket.UpdatedAt = DateTime.UtcNow;

        var authorId = _currentUserService.UserId ?? 1;

        var assignActivity = new TicketActivity
        {
            TicketId = ticket.Id,
            AuthorId = authorId,
            ActivityType = ActivityType.Assignment,
            PreviousValue = oldAssigneeName,
            NewValue = newAssignee.Name,
            Message = $"Solicitud asignada a '{newAssignee.Name}'.",
            IsPublic = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<TicketActivity>().AddAsync(assignActivity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<TicketDto>.Ok(MapToDto(ticket), "Técnico responsable asignado exitosamente");
    }

    private static TicketDto MapToDto(Ticket t) => new()
    {
        Id = t.Id,
        Sequence = t.Sequence,
        Code = t.Code,
        Title = t.Title,
        Description = t.Description,
        Category = t.Category,
        Subcategory = t.Subcategory,
        Priority = t.Priority.ToString().ToLower(),
        PriorityDescription = t.Priority.GetDescription(),
        Status = t.Status.ToString().ToLower(),
        StatusDescription = t.Status.GetDescription(),
        LocationId = t.LocationId,
        LocationName = t.Location?.Name ?? string.Empty,
        LocationAreaId = t.LocationAreaId,
        LocationAreaName = t.LocationArea?.Name,
        RequesterId = t.RequesterId,
        RequesterName = t.Requester?.Name ?? string.Empty,
        RequesterEmail = t.Requester?.Email ?? string.Empty,
        RequesterAvatarUrl = t.Requester?.AvatarUrl,
        AssigneeId = t.AssigneeId,
        AssigneeName = t.Assignee?.Name,
        AssigneeEmail = t.Assignee?.Email,
        AssigneeAvatarUrl = t.Assignee?.AvatarUrl,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
        SlaDueAt = t.SlaDueAt,
        ResolvedAt = t.ResolvedAt,
        ResolutionSummary = t.ResolutionSummary,
        Activities = t.Activities.OrderByDescending(a => a.CreatedAt).Select(a => new TicketActivityDto
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
        Attachments = t.Attachments.Select(a => new AttachmentDto
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
}
