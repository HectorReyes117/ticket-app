using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Auth.DTOs;
using TicketApp.Domain.Common;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Auth.Queries;

public class GetCurrentUserQuery : IRequest<ApiResponse<UserProfileDto>>
{
}

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, ApiResponse<UserProfileDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetCurrentUserQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<UserProfileDto>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("Usuario no autenticado.");
        }

        var user = await _unitOfWork.Repository<User>()
            .Query()
            .Include(u => u.Location)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == _currentUserService.UserId.Value, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("Usuario", _currentUserService.UserId.Value);
        }

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
            MustChangePassword = user.MustChangePassword,
            IsActive = user.IsActive
        };

        return ApiResponse<UserProfileDto>.Ok(profile);
    }
}
