using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Auth.Queries;

public record ValidateResetTokenQuery(string Token) : IRequest<ApiResponse<bool>>;

public class ValidateResetTokenQueryHandler : IRequestHandler<ValidateResetTokenQuery, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ValidateResetTokenQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<bool>> Handle(ValidateResetTokenQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return ApiResponse<bool>.Ok(false, "Token no proporcionado.");
        }

        var tokenRecord = await _unitOfWork.Repository<PasswordResetToken>().Query()
            .FirstOrDefaultAsync(t => t.Token == request.Token, cancellationToken);

        if (tokenRecord == null || tokenRecord.IsUsed || tokenRecord.ExpiresAt < DateTime.UtcNow)
        {
            return ApiResponse<bool>.Ok(false, "El enlace de recuperación es inválido, ya fue utilizado o ha expirado.");
        }

        return ApiResponse<bool>.Ok(true, "Token válido.");
    }
}
