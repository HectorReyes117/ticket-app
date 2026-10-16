using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Domain.Common;
using TicketApp.Domain.Entities;
using TicketApp.Domain.Enums;
using ValidationException = TicketApp.Application.Common.Exceptions.ValidationException;

namespace TicketApp.Application.Features.Users.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string RoleDescription { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string? AvatarUrl { get; set; }
    public string Presence { get; set; } = string.Empty;
    public int? LocationId { get; set; }
    public string? LocationName { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int OpenTicketsCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class GetUsersQuery : IRequest<ApiResponse<PagedResult<UserDto>>>
{
    public string? Search { get; set; }
    public UserRole? Role { get; set; }
    public UserPresence? Presence { get; set; }
    public int? LocationId { get; set; }
    public bool? ActiveOnly { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, ApiResponse<PagedResult<UserDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUsersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<PagedResult<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Repository<User>()
            .Query()
            .Include(u => u.Location)
            .Include(u => u.Department)
            .Include(u => u.AssignedTickets)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(u => u.Name.ToLower().Contains(search) ||
                                     u.Email.ToLower().Contains(search) ||
                                     u.EmployeeCode.ToLower().Contains(search) ||
                                     u.Position.ToLower().Contains(search) ||
                                     u.Phone.ToLower().Contains(search));
        }

        if (request.Role.HasValue)
            query = query.Where(u => u.Role == request.Role.Value);

        if (request.Presence.HasValue)
            query = query.Where(u => u.Presence == request.Presence.Value);

        if (request.LocationId.HasValue && request.LocationId.Value > 0)
            query = query.Where(u => u.LocationId == request.LocationId.Value);

        if (request.ActiveOnly.HasValue)
            query = query.Where(u => u.IsActive == request.ActiveOnly.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var list = await query
            .OrderBy(u => u.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto
            {
                Id = u.Id,
                EmployeeCode = u.EmployeeCode,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role.ToString().ToLower(),
                RoleDescription = u.Role.GetDescription(),
                Position = u.Position,
                Phone = u.Phone,
                Extension = u.Extension,
                AvatarUrl = u.AvatarUrl,
                Presence = u.Presence.ToString().ToLower(),
                LocationId = u.LocationId,
                LocationName = u.Location != null ? u.Location.Name : null,
                DepartmentId = u.DepartmentId,
                DepartmentName = u.Department != null ? u.Department.Name : null,
                OpenTicketsCount = u.AssignedTickets.Count(t => t.Status == TicketStatus.Pending || t.Status == TicketStatus.InProgress || t.Status == TicketStatus.OnHold),
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<UserDto>(list, totalCount, pageNumber, pageSize);
        return ApiResponse<PagedResult<UserDto>>.Ok(pagedResult);
    }
}

public class CreateUserCommand : IRequest<ApiResponse<UserDto>>
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Requestor;
    public string Position { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string? AvatarUrl { get; set; }
    public int? LocationId { get; set; }
    public int? DepartmentId { get; set; }
}

public class CreateUserValidation : AbstractValidator<CreateUserCommand>
{
    public CreateUserValidation()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre es requerido.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("El correo electrónico es inválido.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).WithMessage("La contraseña debe tener mínimo 6 caracteres.");
    }
}

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, ApiResponse<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<UserDto>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var existing = await _unitOfWork.Repository<User>()
            .Query()
            .AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower(), cancellationToken);

        if (existing)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "Email", new[] { "Ya existe un usuario con este correo electrónico." } }
            });

        var count = await _unitOfWork.Repository<User>().CountAsync(null, cancellationToken);
        var employeeCode = $"#EMP-{(count + 1):D3}";

        var user = new User
        {
            EmployeeCode = employeeCode,
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLower(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Role = request.Role,
            Position = request.Position.Trim(),
            Phone = request.Phone.Trim(),
            Extension = request.Extension?.Trim(),
            AvatarUrl = request.AvatarUrl?.Trim(),
            LocationId = request.LocationId,
            DepartmentId = request.DepartmentId,
            Presence = UserPresence.Online,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<User>().AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _unitOfWork.Repository<User>()
            .Query()
            .Include(u => u.Location)
            .Include(u => u.Department)
            .FirstAsync(u => u.Id == user.Id, cancellationToken);

        var dto = new UserDto
        {
            Id = created.Id,
            EmployeeCode = created.EmployeeCode,
            Name = created.Name,
            Email = created.Email,
            Role = created.Role.ToString().ToLower(),
            RoleDescription = created.Role.GetDescription(),
            Position = created.Position,
            Phone = created.Phone,
            Extension = created.Extension,
            AvatarUrl = created.AvatarUrl,
            Presence = created.Presence.ToString().ToLower(),
            LocationId = created.LocationId,
            LocationName = created.Location?.Name,
            DepartmentId = created.DepartmentId,
            DepartmentName = created.Department?.Name,
            OpenTicketsCount = 0,
            IsActive = created.IsActive,
            CreatedAt = created.CreatedAt
        };

        return ApiResponse<UserDto>.Ok(dto, "Usuario registrado exitosamente");
    }
}

public class GetUserByIdQuery : IRequest<ApiResponse<UserDto>>
{
    public int Id { get; set; }

    public GetUserByIdQuery(int id)
    {
        Id = id;
    }
}

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, ApiResponse<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUserByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<UserDto>> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Repository<User>()
            .Query()
            .Include(u => u.Location)
            .Include(u => u.Department)
            .Include(u => u.AssignedTickets)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null)
            throw new NotFoundException("Usuario", request.Id);

        var dto = new UserDto
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
            OpenTicketsCount = user.AssignedTickets.Count(t => t.Status == TicketStatus.Pending || t.Status == TicketStatus.InProgress || t.Status == TicketStatus.OnHold),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<UserDto>.Ok(dto);
    }
}

public class UpdateUserCommand : IRequest<ApiResponse<UserDto>>
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public UserRole Role { get; set; }
    public string Position { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public string? AvatarUrl { get; set; }
    public UserPresence Presence { get; set; }
    public int? LocationId { get; set; }
    public int? DepartmentId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateUserValidation : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserValidation()
    {
        RuleFor(x => x.Id).GreaterThan(0).WithMessage("ID de usuario inválido.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre es requerido.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("El formato del correo es inválido.");
        When(x => !string.IsNullOrEmpty(x.Password), () =>
        {
            RuleFor(x => x.Password).MinimumLength(6).WithMessage("La nueva contraseña debe tener al menos 6 caracteres.");
        });
    }
}

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, ApiResponse<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public UpdateUserCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<UserDto>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Repository<User>()
            .Query()
            .Include(u => u.Location)
            .Include(u => u.Department)
            .Include(u => u.AssignedTickets)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null)
            throw new NotFoundException("Usuario", request.Id);

        // Check email uniqueness if modified
        if (!string.Equals(user.Email, request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var emailExists = await _unitOfWork.Repository<User>()
                .Query()
                .AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower() && u.Id != user.Id, cancellationToken);

            if (emailExists)
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Email", new[] { "El correo ya está en uso por otro colaborador." } }
                });

            user.Email = request.Email.Trim().ToLower();
        }

        user.Name = request.Name.Trim();
        user.Role = request.Role;
        user.Position = request.Position.Trim();
        user.Phone = request.Phone.Trim();
        user.Extension = request.Extension?.Trim();
        user.AvatarUrl = request.AvatarUrl?.Trim();
        user.Presence = request.Presence;
        user.LocationId = request.LocationId;
        user.DepartmentId = request.DepartmentId;
        user.IsActive = request.IsActive;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(request.Password);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new UserDto
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
            OpenTicketsCount = user.AssignedTickets.Count(t => t.Status == TicketStatus.Pending || t.Status == TicketStatus.InProgress || t.Status == TicketStatus.OnHold),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<UserDto>.Ok(dto, "Información del usuario actualizada exitosamente");
    }
}

public class ToggleUserStatusCommand : IRequest<ApiResponse<bool>>
{
    public int Id { get; set; }
    public bool IsActive { get; set; }
}

public class ToggleUserStatusCommandHandler : IRequestHandler<ToggleUserStatusCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ToggleUserStatusCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<bool>> Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Repository<User>().GetByIdAsync(request.Id, cancellationToken);
        if (user == null)
            throw new NotFoundException("Usuario", request.Id);

        user.IsActive = request.IsActive;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var statusMessage = request.IsActive ? "Usuario activado exitosamente" : "Usuario desactivado exitosamente";
        return ApiResponse<bool>.Ok(user.IsActive, statusMessage);
    }
}

