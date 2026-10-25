using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Domain.Common;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Auth.Commands;

public class ChangeInitialPasswordCommand : IRequest<ApiResponse<bool>>
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmNewPassword { get; set; } = string.Empty;
}

public class ChangeInitialPasswordValidation : AbstractValidator<ChangeInitialPasswordCommand>
{
    public ChangeInitialPasswordValidation()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("La contraseña actual es requerida.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("La nueva contraseña es requerida.")
            .MinimumLength(8).WithMessage("La nueva contraseña debe tener al menos 8 caracteres.")
            .Matches(@"[A-Z]").WithMessage("La nueva contraseña debe contener al menos una letra mayúscula.")
            .Matches(@"[a-z]").WithMessage("La nueva contraseña debe contener al menos una letra minúscula.")
            .Matches(@"[0-9]").WithMessage("La nueva contraseña debe contener al menos un número.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("La nueva contraseña debe contener al menos un carácter especial (@, $, !, %, *, #, ?, &).");

        RuleFor(x => x.ConfirmNewPassword)
            .Equal(x => x.NewPassword).WithMessage("La confirmación de la contraseña no coincide con la nueva contraseña.");
    }
}

public class ChangeInitialPasswordCommandHandler : IRequestHandler<ChangeInitialPasswordCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;

    public ChangeInitialPasswordCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<bool>> Handle(ChangeInitialPasswordCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("Usuario no autenticado.");
        }

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(_currentUserService.UserId.Value, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("Usuario", _currentUserService.UserId.Value);
        }

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new BusinessRuleException("La contraseña actual ingresada es incorrecta.");
        }

        if (request.CurrentPassword == request.NewPassword)
        {
            throw new BusinessRuleException("La nueva contraseña no puede ser igual a la contraseña temporal o anterior.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.MustChangePassword = false;

        await _unitOfWork.Repository<User>().UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Contraseña actualizada exitosamente.");
    }
}
