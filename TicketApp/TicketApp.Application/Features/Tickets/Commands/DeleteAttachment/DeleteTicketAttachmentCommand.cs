using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Domain.Common;
using TicketApp.Domain.Entities;
using TicketApp.Domain.Enums;

namespace TicketApp.Application.Features.Tickets.Commands.DeleteAttachment;

public class DeleteTicketAttachmentCommand : IRequest<ApiResponse<bool>>
{
    public int TicketId { get; set; }
    public int AttachmentId { get; set; }
}

public class DeleteTicketAttachmentValidation : AbstractValidator<DeleteTicketAttachmentCommand>
{
    public DeleteTicketAttachmentValidation()
    {
        RuleFor(x => x.TicketId).GreaterThan(0).WithMessage("ID de ticket inválido.");
        RuleFor(x => x.AttachmentId).GreaterThan(0).WithMessage("ID de archivo o evidencia inválido.");
    }
}

public class DeleteTicketAttachmentCommandHandler : IRequestHandler<DeleteTicketAttachmentCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentUserService _currentUserService;

    public DeleteTicketAttachmentCommandHandler(
        IUnitOfWork unitOfWork,
        IFileStorageService fileStorageService,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteTicketAttachmentCommand request, CancellationToken cancellationToken)
    {
        var currentRole = _currentUserService.Role?.ToLowerInvariant();
        if (currentRole == "requestor")
            throw new UnauthorizedException("Los solicitantes no pueden remover evidencias de una solicitud.");

        var ticket = await _unitOfWork.Repository<Ticket>().GetByIdAsync(request.TicketId, cancellationToken);
        if (ticket == null)
            throw new NotFoundException("Ticket", request.TicketId);

        var attachment = await _unitOfWork.Repository<Attachment>()
            .Query()
            .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.TicketId == request.TicketId, cancellationToken);

        if (attachment == null)
            throw new NotFoundException("Attachment", request.AttachmentId);

        // Delete physical file if exists
        if (!string.IsNullOrWhiteSpace(attachment.PhysicalPath))
        {
            await _fileStorageService.DeleteFileAsync(attachment.PhysicalPath, cancellationToken);
        }

        // Record activity in timeline
        var userId = _currentUserService.UserId ?? 1;
        var activity = new TicketActivity
        {
            TicketId = ticket.Id,
            AuthorId = userId,
            ActivityType = ActivityType.Attachment,
            Message = $"Evidencia o archivo eliminado: {attachment.FileName}",
            IsPublic = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<TicketActivity>().AddAsync(activity, cancellationToken);

        await _unitOfWork.Repository<Attachment>().DeleteAsync(attachment, cancellationToken);
        ticket.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Evidencia eliminada correctamente.");
    }
}
