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

namespace TicketApp.Application.Features.Tickets.Commands.UpdateTicketStatus;

public class UpdateTicketStatusCommand : IRequest<ApiResponse<TicketDto>>
{
    public int TicketId { get; set; }
    public TicketStatus NewStatus { get; set; }
    public string? ResolutionSummary { get; set; }
    public string? Note { get; set; }
}

public class UpdateTicketStatusValidation : AbstractValidator<UpdateTicketStatusCommand>
{
    public UpdateTicketStatusValidation()
    {
        RuleFor(x => x.TicketId).GreaterThan(0).WithMessage("ID de ticket inválido.");
        RuleFor(x => x.NewStatus).IsInEnum().WithMessage("Estado de ticket inválido.");

        When(x => x.NewStatus == TicketStatus.Resolved, () =>
        {
            RuleFor(x => x.ResolutionSummary)
                .NotEmpty().WithMessage("Al resolver un ticket es obligatorio incluir el resumen de resolución.");
        });
    }
}

public class UpdateTicketStatusCommandHandler : IRequestHandler<UpdateTicketStatusCommand, ApiResponse<TicketDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public UpdateTicketStatusCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<TicketDto>> Handle(UpdateTicketStatusCommand request, CancellationToken cancellationToken)
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

        var previousStatus = ticket.Status;
        ticket.Status = request.NewStatus;
        ticket.UpdatedAt = DateTime.UtcNow;

        if (request.NewStatus == TicketStatus.Resolved)
        {
            ticket.ResolvedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(request.ResolutionSummary))
                ticket.ResolutionSummary = request.ResolutionSummary.Trim();
        }

        var authorId = _currentUserService.UserId ?? 1;

        var statusActivity = new TicketActivity
        {
            TicketId = ticket.Id,
            AuthorId = authorId,
            ActivityType = ActivityType.StatusChange,
            PreviousValue = previousStatus.ToString(),
            NewValue = request.NewStatus.ToString(),
            Message = $"Estado actualizado de '{previousStatus.GetDescription()}' a '{request.NewStatus.GetDescription()}'. {(string.IsNullOrWhiteSpace(request.Note) ? "" : "Nota: " + request.Note.Trim())}",
            IsPublic = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<TicketActivity>().AddAsync(statusActivity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<TicketDto>.Ok(MapToDto(ticket), "Estado actualizado correctamente");
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
