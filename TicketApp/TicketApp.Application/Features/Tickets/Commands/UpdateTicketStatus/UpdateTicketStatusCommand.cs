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
    public bool NotifyRequesterByEmail { get; set; } = false;
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
    private readonly IEmailService _emailService;

    public UpdateTicketStatusCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _emailService = emailService;
    }

    public async Task<ApiResponse<TicketDto>> Handle(UpdateTicketStatusCommand request, CancellationToken cancellationToken)
    {
        var currentRole = _currentUserService.Role?.ToLowerInvariant();
        if (currentRole == "requestor")
            throw new UnauthorizedException("Los solicitantes no tienen autorización para modificar el estado de una solicitud.");

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

        // Regla: Solo una solicitud con responsable asignado puede pasar a un estado distinto de 'Pending'
        if (request.NewStatus != TicketStatus.Pending && !ticket.AssigneeId.HasValue)
        {
            throw new BusinessRuleException("La solicitud debe estar asignada a un responsable para poder cambiar su estado a 'En Proceso' u otro estado operativo.");
        }

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

        // Envío de correo al solicitante si la casilla está marcada
        if (request.NotifyRequesterByEmail && ticket.Requester != null && !string.IsNullOrWhiteSpace(ticket.Requester.Email))
        {
            try
            {
                var frontendUrl = _emailService.GetFrontendUrl().TrimEnd('/');
                var ticketUrl = $"{frontendUrl}/tickets/{ticket.Id}";

                var observationHtml = "";
                if (!string.IsNullOrWhiteSpace(request.Note))
                {
                    observationHtml = $@"
                    <div style=""background-color: #ffffff; border-left: 4px solid #2563eb; border-top: 1px solid #dce9ff; border-right: 1px solid #dce9ff; border-bottom: 1px solid #dce9ff; border-radius: 0 12px 12px 0; padding: 18px 20px; margin-bottom: 24px;"">
                      <div style=""font-size: 11px; font-weight: 700; text-transform: uppercase; color: #004ac6; letter-spacing: 0.05em;"">&#128172; Observación del Especialista:</div>
                      <blockquote style=""font-size: 13.5px; line-height: 22px; color: #0b1c30; font-style: italic; margin: 8px 0 0 0;"">
                        “{request.Note.Trim()}”
                      </blockquote>
                    </div>";
                }

                var replacements = new Dictionary<string, string>
                {
                    { "RequesterName", ticket.Requester.Name },
                    { "TicketCode", ticket.Code },
                    { "TicketTitle", ticket.Title },
                    { "LocationName", ticket.Location?.Name ?? "Sede Central" },
                    { "AreaName", ticket.LocationArea?.Name ?? "Área General" },
                    { "PreviousStatus", previousStatus.GetDescription() },
                    { "NewStatus", request.NewStatus.GetDescription() },
                    { "AssigneeName", ticket.Assignee?.Name ?? "Equipo de Soporte TI" },
                    { "ObservationBlock", observationHtml },
                    { "TicketUrl", ticketUrl }
                };

                await _emailService.SendTemplateEmailAsync(
                    ticket.Requester.Email,
                    $"[{ticket.Code}] Actualización en tu Solicitud de Servicio: {ticket.Title}",
                    "TicketUpdateNotificationTemplate",
                    replacements,
                    cancellationToken);
            }
            catch
            {
                // El fallo de envío de correo no debe abortar la transacción de base de datos
            }
        }

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
