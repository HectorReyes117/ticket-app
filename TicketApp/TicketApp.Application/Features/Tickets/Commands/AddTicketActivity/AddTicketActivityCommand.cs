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

namespace TicketApp.Application.Features.Tickets.Commands.AddTicketActivity;

public class AddTicketActivityCommand : IRequest<ApiResponse<TicketActivityDto>>
{
    public int TicketId { get; set; }
    public ActivityType ActivityType { get; set; } = ActivityType.Note;
    public string Message { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public bool NotifyRequesterByEmail { get; set; } = false;
}

public class AddTicketActivityValidation : AbstractValidator<AddTicketActivityCommand>
{
    public AddTicketActivityValidation()
    {
        RuleFor(x => x.TicketId).GreaterThan(0).WithMessage("ID de ticket inválido.");
        RuleFor(x => x.Message).NotEmpty().WithMessage("El comentario o nota no puede estar vacío.");
    }
}

public class AddTicketActivityCommandHandler : IRequestHandler<AddTicketActivityCommand, ApiResponse<TicketActivityDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;

    public AddTicketActivityCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _emailService = emailService;
    }

    public async Task<ApiResponse<TicketActivityDto>> Handle(AddTicketActivityCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _unitOfWork.Repository<Ticket>()
            .Query()
            .Include(t => t.Requester)
            .Include(t => t.Assignee)
            .Include(t => t.Location)
            .Include(t => t.LocationArea)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null)
            throw new NotFoundException("Ticket", request.TicketId);

        var authorId = _currentUserService.UserId ?? 1;
        var author = await _unitOfWork.Repository<User>().GetByIdAsync(authorId, cancellationToken);

        var activity = new TicketActivity
        {
            TicketId = request.TicketId,
            AuthorId = authorId,
            ActivityType = request.ActivityType,
            Message = request.Message.Trim(),
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<TicketActivity>().AddAsync(activity, cancellationToken);

        ticket.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Envío de correo al solicitante si es nota pública y la opción de notificar está activa
        if (request.IsPublic && request.NotifyRequesterByEmail && ticket.Requester != null && !string.IsNullOrWhiteSpace(ticket.Requester.Email))
        {
            try
            {
                var frontendUrl = _emailService.GetFrontendUrl().TrimEnd('/');
                var ticketUrl = $"{frontendUrl}/tickets/{ticket.Id}";

                var observationHtml = $@"
                <div style=""background-color: #ffffff; border-left: 4px solid #2563eb; border-top: 1px solid #dce9ff; border-right: 1px solid #dce9ff; border-bottom: 1px solid #dce9ff; border-radius: 0 12px 12px 0; padding: 18px 20px; margin-bottom: 24px;"">
                  <div style=""font-size: 11px; font-weight: 700; text-transform: uppercase; color: #004ac6; letter-spacing: 0.05em;"">&#128172; Nueva Observación / Respuesta del Especialista:</div>
                  <blockquote style=""font-size: 13.5px; line-height: 22px; color: #0b1c30; font-style: italic; margin: 8px 0 0 0;"">
                    “{request.Message.Trim()}”
                  </blockquote>
                </div>";

                var statusDesc = ticket.Status.GetDescription();
                var replacements = new Dictionary<string, string>
                {
                    { "RequesterName", ticket.Requester.Name },
                    { "TicketCode", ticket.Code },
                    { "TicketTitle", ticket.Title },
                    { "LocationName", ticket.Location?.Name ?? "Sede Central" },
                    { "AreaName", ticket.LocationArea?.Name ?? "Área General" },
                    { "PreviousStatus", statusDesc },
                    { "NewStatus", statusDesc },
                    { "AssigneeName", author?.Name ?? ticket.Assignee?.Name ?? "Equipo de Soporte TI" },
                    { "ObservationBlock", observationHtml },
                    { "TicketUrl", ticketUrl }
                };

                await _emailService.SendTemplateEmailAsync(
                    ticket.Requester.Email,
                    $"[{ticket.Code}] Nueva observación en tu Solicitud de Servicio: {ticket.Title}",
                    "TicketUpdateNotificationTemplate",
                    replacements,
                    cancellationToken);
            }
            catch
            {
                // El fallo de envío no bloquea la persistencia de la observación
            }
        }

        var dto = new TicketActivityDto
        {
            Id = activity.Id,
            TicketId = activity.TicketId,
            AuthorId = activity.AuthorId,
            AuthorName = author?.Name ?? "Usuario",
            AuthorAvatarUrl = author?.AvatarUrl,
            ActivityType = activity.ActivityType.ToString().ToLower(),
            ActivityTypeDescription = activity.ActivityType.GetDescription(),
            Message = activity.Message,
            IsPublic = activity.IsPublic,
            CreatedAt = activity.CreatedAt
        };

        return ApiResponse<TicketActivityDto>.Ok(dto, "Comentario registrado exitosamente");
    }
}
