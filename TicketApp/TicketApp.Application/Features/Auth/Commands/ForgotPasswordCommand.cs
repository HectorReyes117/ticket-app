using System.Security.Cryptography;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Auth.DTOs;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Auth.Commands;

public record ForgotPasswordCommand(string Email) : IRequest<ApiResponse<ResetPasswordResultDto>>;

public class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es requerido.")
            .EmailAddress().WithMessage("El formato del correo electrónico no es válido.");
    }
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, ApiResponse<ResetPasswordResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(
        IUnitOfWork unitOfWork,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
    }

    public async Task<ApiResponse<ResetPasswordResultDto>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _unitOfWork.Repository<User>().Query()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email && u.IsActive, cancellationToken);

        // Por seguridad, si el usuario no existe no revelamos que no existe, pero respondemos OK
        if (user == null)
        {
            return ApiResponse<ResetPasswordResultDto>.Ok(
                new ResetPasswordResultDto
                {
                    Success = true,
                    Message = "Si el correo está registrado en el sistema, recibirás un enlace de recuperación en los próximos minutos."
                });
        }

        // Generar un token criptográficamente seguro
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToHexString(tokenBytes).ToLowerInvariant();

        // Expira en 2 horas por defecto
        var expiresInHours = 2;
        var expiresAt = DateTime.UtcNow.AddHours(expiresInHours);

        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            Token = token,
            ExpiresAt = expiresAt,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<PasswordResetToken>().AddAsync(resetToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Obtener la URL del frontend resuelta por IEmailService (según entorno o variable)
        var frontendUrl = _emailService.GetFrontendUrl();
        var resetLink = $"{frontendUrl.TrimEnd('/')}/reset-password?token={token}";

        // Enviar plantilla de correo
        var replacements = new Dictionary<string, string>
        {
            { "Name", user.Name },
            { "Email", user.Email },
            { "ResetLink", resetLink },
            { "ExpiresInHours", expiresInHours.ToString() }
        };

        await _emailService.SendTemplateEmailAsync(
            user.Email,
            "Restablecimiento de contraseña - TicketApp",
            "PasswordResetTemplate",
            replacements,
            cancellationToken);

        return ApiResponse<ResetPasswordResultDto>.Ok(
            new ResetPasswordResultDto
            {
                Success = true,
                Message = "Hemos enviado las instrucciones y el enlace para restablecer tu contraseña a tu correo electrónico."
            });
    }
}
