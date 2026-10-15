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

namespace TicketApp.Application.Features.Tickets.Commands.CreateTicket;

public class CreateTicketCommand : IRequest<ApiResponse<TicketDto>>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "TI & Redes";
    public string? Subcategory { get; set; }
    public Priority Priority { get; set; } = Priority.Medium;
    public int LocationId { get; set; }
    public int? LocationAreaId { get; set; }
}

public class CreateTicketValidation : AbstractValidator<CreateTicketCommand>
{
    public CreateTicketValidation()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("El título o asunto es requerido.")
            .MaximumLength(150).WithMessage("El título no puede exceder 150 caracteres.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("La descripción detallada es requerida.");

        RuleFor(x => x.LocationId)
            .GreaterThan(0).WithMessage("Debe seleccionar una sede o campus válido.");
    }
}

public class CreateTicketCommandHandler : IRequestHandler<CreateTicketCommand, ApiResponse<TicketDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CreateTicketCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<TicketDto>> Handle(CreateTicketCommand request, CancellationToken cancellationToken)
    {
        var requesterId = _currentUserService.UserId ?? 1;

        // Sequence generation
        var lastSequence = await _unitOfWork.Repository<Ticket>()
            .Query()
            .OrderByDescending(t => t.Sequence)
            .Select(t => t.Sequence)
            .FirstOrDefaultAsync(cancellationToken);

        var newSequence = lastSequence == 0 ? 1001 : lastSequence + 1;
        var code = $"#TK-{newSequence}";

        var slaHours = request.Priority switch
        {
            Priority.Critical => 4,
            Priority.High => 12,
            Priority.Medium => 24,
            _ => 48
        };

        var ticket = new Ticket
        {
            Sequence = newSequence,
            Code = code,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "TI & Redes" : request.Category,
            Subcategory = request.Subcategory,
            Priority = request.Priority,
            Status = TicketStatus.Pending,
            LocationId = request.LocationId,
            LocationAreaId = request.LocationAreaId,
            RequesterId = requesterId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            SlaDueAt = DateTime.UtcNow.AddHours(slaHours)
        };

        await _unitOfWork.Repository<Ticket>().AddAsync(ticket, cancellationToken);

        // Record initial activity
        var activity = new TicketActivity
        {
            Ticket = ticket,
            AuthorId = requesterId,
            ActivityType = ActivityType.Created,
            Message = "Solicitud registrada en el sistema y puesta en estado Pendiente.",
            IsPublic = true,
            NewValue = TicketStatus.Pending.ToString(),
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<TicketActivity>().AddAsync(activity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties
        var created = await _unitOfWork.Repository<Ticket>()
            .Query()
            .Include(t => t.Location)
            .Include(t => t.LocationArea)
            .Include(t => t.Requester)
            .Include(t => t.Assignee)
            .Include(t => t.Activities).ThenInclude(a => a.Author)
            .Include(t => t.Attachments).ThenInclude(a => a.UploadedBy)
            .FirstAsync(t => t.Id == ticket.Id, cancellationToken);

        return ApiResponse<TicketDto>.Ok(MapToDto(created), "Solicitud creada exitosamente");
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
