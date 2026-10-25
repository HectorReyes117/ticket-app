using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Auth.DTOs;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Auth.Commands;

public record ResetPasswordCommand(string Token, string NewPassword, string ConfirmPassword) : IRequest<ApiResponse<ResetPasswordResultDto>>;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("El token de restablecimiento es requerido.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("La nueva contraseña es requerida.")
            .MinimumLength(8).WithMessage("La nueva contraseña debe tener al menos 8 caracteres.")
            .Matches(@"[A-Z]").WithMessage("La nueva contraseña debe contener al menos una letra mayúscula.")
            .Matches(@"[a-z]").WithMessage("La nueva contraseña debe contener al menos una letra minúscula.")
            .Matches(@"[0-9]").WithMessage("La nueva contraseña debe contener al menos un número.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("La nueva contraseña debe contener al menos un carácter especial (@, $, !, %, *, #, ?, &).");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Las contraseñas no coinciden.");
    }
}

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, ApiResponse<ResetPasswordResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<ResetPasswordResultDto>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var tokenRecord = await _unitOfWork.Repository<PasswordResetToken>().Query()
            .FirstOrDefaultAsync(t => t.Token == request.Token, cancellationToken);

        if (tokenRecord == null)
        {
            throw new BusinessRuleException("El enlace de restablecimiento es inválido o no existe.");
        }

        if (tokenRecord.IsUsed)
        {
            throw new BusinessRuleException("Este enlace de restablecimiento ya ha sido utilizado.");
        }

        if (tokenRecord.ExpiresAt < DateTime.UtcNow)
        {
            throw new BusinessRuleException("El enlace de restablecimiento ha expirado. Por favor solicita uno nuevo.");
        }

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(tokenRecord.UserId, cancellationToken);
        if (user == null || !user.IsActive)
        {
            throw new NotFoundException("Usuario no encontrado o inactivo.");
        }

        // Actualizar contraseña
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        await _unitOfWork.Repository<User>().UpdateAsync(user, cancellationToken);

        // Quemar el token
        tokenRecord.IsUsed = true;
        tokenRecord.UsedAt = DateTime.UtcNow;
        await _unitOfWork.Repository<PasswordResetToken>().UpdateAsync(tokenRecord, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<ResetPasswordResultDto>.Ok(
            new ResetPasswordResultDto
            {
                Success = true,
                Message = "Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales."
            });
    }
}
