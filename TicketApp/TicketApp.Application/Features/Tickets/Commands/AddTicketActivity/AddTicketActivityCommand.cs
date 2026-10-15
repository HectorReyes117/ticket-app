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

    public AddTicketActivityCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<TicketActivityDto>> Handle(AddTicketActivityCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _unitOfWork.Repository<Ticket>().GetByIdAsync(request.TicketId, cancellationToken);
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
