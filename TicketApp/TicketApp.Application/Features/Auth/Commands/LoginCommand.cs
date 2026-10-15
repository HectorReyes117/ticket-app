using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Auth.DTOs;
using TicketApp.Domain.Common;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Auth.Commands;

public class LoginCommand : IRequest<ApiResponse<AuthResponseDto>>
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginValidation : AbstractValidator<LoginCommand>
{
    public LoginValidation()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es requerido.")
            .EmailAddress().WithMessage("El formato del correo es inválido.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("La contraseña es requerida.")
            .MinimumLength(6).WithMessage("La contraseña debe tener al menos 6 caracteres.");
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, ApiResponse<AuthResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHasher _passwordHasher;

    public LoginCommandHandler(IUnitOfWork unitOfWork, IJwtTokenService jwtTokenService, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<AuthResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Repository<User>()
            .Query()
            .Include(u => u.Location)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower(), cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Credenciales inválidas. Verifique su correo o contraseña.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("Esta cuenta de usuario ha sido desactivada. Comuníquese con soporte.");
        }

        var token = _jwtTokenService.GenerateToken(user);

        var profile = new UserProfileDto
        {
            Id = user.Id,
            EmployeeCode = user.EmployeeCode,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.ToString().ToLower(),
            RoleDescription = user.Role.GetDescription(),
            Position = user.Position,
            Phone = user.Phone,
            Extension = user.Extension,
            AvatarUrl = user.AvatarUrl,
            Presence = user.Presence.ToString().ToLower(),
            LocationId = user.LocationId,
            LocationName = user.Location?.Name,
            DepartmentId = user.DepartmentId,
            DepartmentName = user.Department?.Name,
            IsActive = user.IsActive
        };

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            User = profile
        }, "Inicio de sesión exitoso");
    }
}
