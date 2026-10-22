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

namespace TicketApp.Application.Features.Tickets.Commands.UploadAttachment;

public class UploadTicketAttachmentCommand : IRequest<ApiResponse<AttachmentDto>>
{
    public int TicketId { get; set; }
    public Stream FileStream { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileLength { get; set; }
}

public class UploadTicketAttachmentValidation : AbstractValidator<UploadTicketAttachmentCommand>
{
    public UploadTicketAttachmentValidation()
    {
        RuleFor(x => x.TicketId).GreaterThan(0).WithMessage("ID de ticket inválido.");
        RuleFor(x => x.FileName).NotEmpty().WithMessage("El nombre de archivo es requerido.");
        RuleFor(x => x.FileLength).GreaterThan(0).WithMessage("El archivo no puede estar vacío.");
    }
}

public class UploadTicketAttachmentCommandHandler : IRequestHandler<UploadTicketAttachmentCommand, ApiResponse<AttachmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentUserService _currentUserService;

    public UploadTicketAttachmentCommandHandler(IUnitOfWork unitOfWork, IFileStorageService fileStorageService, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<AttachmentDto>> Handle(UploadTicketAttachmentCommand request, CancellationToken cancellationToken)
    {
        var currentRole = _currentUserService.Role?.ToLowerInvariant();
        if (currentRole == "requestor")
            throw new UnauthorizedException("Los solicitantes no pueden adjuntar archivos una vez que la solicitud ha sido creada.");

        var ticket = await _unitOfWork.Repository<Ticket>().GetByIdAsync(request.TicketId, cancellationToken);
        if (ticket == null)
            throw new NotFoundException("Ticket", request.TicketId);

        var userId = _currentUserService.UserId ?? 1;
        var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken);

        var (fileUrl, physicalPath) = await _fileStorageService.SaveFileAsync(
            request.FileStream, request.FileName, "evidences", cancellationToken);

        var attachment = new Attachment
        {
            TicketId = ticket.Id,
            UploadedById = userId,
            FileName = request.FileName,
            FileUrl = fileUrl,
            PhysicalPath = physicalPath,
            FileSize = request.FileLength,
            MimeType = string.IsNullOrWhiteSpace(request.ContentType) ? "application/octet-stream" : request.ContentType,
            UploadedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<Attachment>().AddAsync(attachment, cancellationToken);

        // Record attachment activity in timeline
        var activity = new TicketActivity
        {
            TicketId = ticket.Id,
            AuthorId = userId,
            ActivityType = ActivityType.Attachment,
            Message = $"Evidencia o archivo adjunto agregado: {request.FileName}",
            IsPublic = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<TicketActivity>().AddAsync(activity, cancellationToken);
        ticket.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new AttachmentDto
        {
            Id = attachment.Id,
            TicketId = attachment.TicketId,
            UploadedById = attachment.UploadedById,
            UploadedByName = user?.Name ?? "Usuario",
            FileName = attachment.FileName,
            FileUrl = attachment.FileUrl,
            FileSize = attachment.FileSize,
            MimeType = attachment.MimeType,
            UploadedAt = attachment.UploadedAt
        };

        return ApiResponse<AttachmentDto>.Ok(dto, "Archivo adjuntado correctamente");
    }
}
