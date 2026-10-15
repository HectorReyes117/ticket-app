using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Exceptions;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Locations.DTOs;

public class LocationAreaDto
{
    public int Id { get; set; }
    public int LocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? FloorOrBlock { get; set; }
    public bool IsActive { get; set; }
}

public class LocationDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FacilityType { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public string Phone { get; set; } = string.Empty;
    public int? CustodianId { get; set; }
    public string? CustodianName { get; set; }
    public bool IsActive { get; set; }
    public List<LocationAreaDto> Areas { get; set; } = new();
    public int ActiveTicketsCount { get; set; }
}

public class GetLocationsQuery : IRequest<ApiResponse<IReadOnlyList<LocationDto>>>
{
}

public class GetLocationsQueryHandler : IRequestHandler<GetLocationsQuery, ApiResponse<IReadOnlyList<LocationDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLocationsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<IReadOnlyList<LocationDto>>> Handle(GetLocationsQuery request, CancellationToken cancellationToken)
    {
        var locations = await _unitOfWork.Repository<Location>()
            .Query()
            .Include(l => l.Custodian)
            .Include(l => l.Areas)
            .Include(l => l.Tickets)
            .AsNoTracking()
            .OrderBy(l => l.Name)
            .Select(l => new LocationDto
            {
                Id = l.Id,
                Code = l.Code,
                Name = l.Name,
                FacilityType = l.FacilityType,
                Address = l.Address,
                City = l.City,
                PostalCode = l.PostalCode,
                Phone = l.Phone,
                CustodianId = l.CustodianId,
                CustodianName = l.Custodian != null ? l.Custodian.Name : null,
                IsActive = l.IsActive,
                Areas = l.Areas.Where(a => a.IsActive).Select(a => new LocationAreaDto
                {
                    Id = a.Id,
                    LocationId = a.LocationId,
                    Name = a.Name,
                    FloorOrBlock = a.FloorOrBlock,
                    IsActive = a.IsActive
                }).ToList(),
                ActiveTicketsCount = l.Tickets.Count(t => t.Status != Domain.Enums.TicketStatus.Resolved && t.Status != Domain.Enums.TicketStatus.Cancelled)
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<LocationDto>>.Ok(locations);
    }
}

public class CreateLocationCommand : IRequest<ApiResponse<LocationDto>>
{
    public string Name { get; set; } = string.Empty;
    public string FacilityType { get; set; } = "Campus Principal";
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public string Phone { get; set; } = string.Empty;
    public int? CustodianId { get; set; }
    public List<string>? InitialAreas { get; set; }
}

public class CreateLocationValidation : AbstractValidator<CreateLocationCommand>
{
    public CreateLocationValidation()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre de la sede o campus es requerido.");
        RuleFor(x => x.Address).NotEmpty().WithMessage("La dirección es requerida.");
        RuleFor(x => x.City).NotEmpty().WithMessage("La ciudad es requerida.");
        RuleFor(x => x.Phone).NotEmpty().WithMessage("El teléfono de contacto es requerido.");
    }
}

public class CreateLocationCommandHandler : IRequestHandler<CreateLocationCommand, ApiResponse<LocationDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateLocationCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<LocationDto>> Handle(CreateLocationCommand request, CancellationToken cancellationToken)
    {
        var count = await _unitOfWork.Repository<Location>().CountAsync(null, cancellationToken);
        var code = $"#SED-{(count + 1):D3}";

        var location = new Location
        {
            Code = code,
            Name = request.Name.Trim(),
            FacilityType = string.IsNullOrWhiteSpace(request.FacilityType) ? "Campus Principal" : request.FacilityType.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            PostalCode = request.PostalCode?.Trim(),
            Phone = request.Phone.Trim(),
            CustodianId = request.CustodianId,
            IsActive = true
        };

        if (request.InitialAreas != null && request.InitialAreas.Any())
        {
            foreach (var areaName in request.InitialAreas.Where(a => !string.IsNullOrWhiteSpace(a)))
            {
                location.Areas.Add(new LocationArea
                {
                    Name = areaName.Trim(),
                    IsActive = true
                });
            }
        }

        await _unitOfWork.Repository<Location>().AddAsync(location, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _unitOfWork.Repository<Location>()
            .Query()
            .Include(l => l.Custodian)
            .Include(l => l.Areas)
            .FirstAsync(l => l.Id == location.Id, cancellationToken);

        var dto = new LocationDto
        {
            Id = created.Id,
            Code = created.Code,
            Name = created.Name,
            FacilityType = created.FacilityType,
            Address = created.Address,
            City = created.City,
            PostalCode = created.PostalCode,
            Phone = created.Phone,
            CustodianId = created.CustodianId,
            CustodianName = created.Custodian?.Name,
            IsActive = created.IsActive,
            Areas = created.Areas.Select(a => new LocationAreaDto
            {
                Id = a.Id,
                LocationId = a.LocationId,
                Name = a.Name,
                FloorOrBlock = a.FloorOrBlock,
                IsActive = a.IsActive
            }).ToList()
        };

        return ApiResponse<LocationDto>.Ok(dto, "Sede registrada exitosamente");
    }
}

public class CreateLocationAreaCommand : IRequest<ApiResponse<LocationAreaDto>>
{
    public int LocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? FloorOrBlock { get; set; }
}

public class CreateLocationAreaValidation : AbstractValidator<CreateLocationAreaCommand>
{
    public CreateLocationAreaValidation()
    {
        RuleFor(x => x.LocationId).GreaterThan(0).WithMessage("ID de sede inválido.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre del área o pabellón es requerido.");
    }
}

public class CreateLocationAreaCommandHandler : IRequestHandler<CreateLocationAreaCommand, ApiResponse<LocationAreaDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateLocationAreaCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<LocationAreaDto>> Handle(CreateLocationAreaCommand request, CancellationToken cancellationToken)
    {
        var location = await _unitOfWork.Repository<Location>().GetByIdAsync(request.LocationId, cancellationToken);
        if (location == null)
            throw new NotFoundException("Sede o Campus", request.LocationId);

        var area = new LocationArea
        {
            LocationId = request.LocationId,
            Name = request.Name.Trim(),
            FloorOrBlock = request.FloorOrBlock?.Trim(),
            IsActive = true
        };

        await _unitOfWork.Repository<LocationArea>().AddAsync(area, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new LocationAreaDto
        {
            Id = area.Id,
            LocationId = area.LocationId,
            Name = area.Name,
            FloorOrBlock = area.FloorOrBlock,
            IsActive = area.IsActive
        };

        return ApiResponse<LocationAreaDto>.Ok(dto, "Área física vinculada exitosamente");
    }
}
