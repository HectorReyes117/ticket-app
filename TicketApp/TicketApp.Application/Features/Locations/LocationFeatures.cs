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
    public string? IpGuardExtension { get; set; }
    public string? SecurityNotes { get; set; }
    public string? EstimatedStaffCapacity { get; set; }
    public string? AvailableFloors { get; set; }
    public int? CustodianId { get; set; }
    public string? CustodianName { get; set; }
    public bool IsActive { get; set; }
    public List<LocationAreaDto> Areas { get; set; } = new();
    public int ActiveTicketsCount { get; set; }
}

public class GetLocationsQuery : IRequest<ApiResponse<PagedResult<LocationDto>>>
{
    public string? Search { get; set; }
    public string? FacilityType { get; set; }
    public bool? ActiveOnly { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetLocationsQueryHandler : IRequestHandler<GetLocationsQuery, ApiResponse<PagedResult<LocationDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLocationsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<PagedResult<LocationDto>>> Handle(GetLocationsQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Repository<Location>()
            .Query()
            .Include(l => l.Custodian)
            .Include(l => l.Areas)
            .Include(l => l.Tickets)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(l => l.Name.ToLower().Contains(search) ||
                                     l.City.ToLower().Contains(search) ||
                                     l.Address.ToLower().Contains(search) ||
                                     l.Code.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(request.FacilityType) && request.FacilityType.ToLower() != "all")
        {
            var fType = request.FacilityType.Trim().ToLower();
            if (fType == "main")
            {
                query = query.Where(l => l.FacilityType.ToLower().Contains("principal") || l.FacilityType.ToLower().Contains("campus"));
            }
            else if (fType == "dc" || fType == "datacenter")
            {
                query = query.Where(l => l.FacilityType.ToLower().Contains("datos") || l.FacilityType.ToLower().Contains("data") || l.Name.ToLower().Contains("data") || l.Name.ToLower().Contains("datos"));
            }
            else if (fType == "regional" || fType == "branch")
            {
                query = query.Where(l => l.FacilityType.ToLower().Contains("sucursal") || l.FacilityType.ToLower().Contains("regional") || l.FacilityType.ToLower().Contains("edificio"));
            }
            else
            {
                query = query.Where(l => l.FacilityType.ToLower().Contains(fType));
            }
        }

        if (request.ActiveOnly.HasValue)
        {
            query = query.Where(l => l.IsActive == request.ActiveOnly.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 50 : request.PageSize;

        var locations = await query
            .OrderBy(l => l.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
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
                IpGuardExtension = l.IpGuardExtension,
                SecurityNotes = l.SecurityNotes,
                EstimatedStaffCapacity = l.EstimatedStaffCapacity,
                AvailableFloors = l.AvailableFloors,
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

        var pagedResult = new PagedResult<LocationDto>(locations, totalCount, pageNumber, pageSize);
        return ApiResponse<PagedResult<LocationDto>>.Ok(pagedResult);
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
    public string? IpGuardExtension { get; set; }
    public string? SecurityNotes { get; set; }
    public string? EstimatedStaffCapacity { get; set; }
    public string? AvailableFloors { get; set; }
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
            IpGuardExtension = request.IpGuardExtension?.Trim(),
            SecurityNotes = request.SecurityNotes?.Trim(),
            EstimatedStaffCapacity = request.EstimatedStaffCapacity?.Trim(),
            AvailableFloors = request.AvailableFloors?.Trim(),
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
            IpGuardExtension = created.IpGuardExtension,
            SecurityNotes = created.SecurityNotes,
            EstimatedStaffCapacity = created.EstimatedStaffCapacity,
            AvailableFloors = created.AvailableFloors,
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

public class UpdateLocationCommand : IRequest<ApiResponse<LocationDto>>
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FacilityType { get; set; } = "Campus Principal";
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? IpGuardExtension { get; set; }
    public string? SecurityNotes { get; set; }
    public string? EstimatedStaffCapacity { get; set; }
    public string? AvailableFloors { get; set; }
    public int? CustodianId { get; set; }
    public bool? IsActive { get; set; }
    public List<string>? Areas { get; set; }
}

public class UpdateLocationCommandHandler : IRequestHandler<UpdateLocationCommand, ApiResponse<LocationDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateLocationCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<LocationDto>> Handle(UpdateLocationCommand request, CancellationToken cancellationToken)
    {
        var location = await _unitOfWork.Repository<Location>()
            .Query()
            .Include(l => l.Custodian)
            .Include(l => l.Areas)
            .FirstOrDefaultAsync(l => l.Id == request.Id, cancellationToken);

        if (location == null)
            throw new NotFoundException("Sede o Campus", request.Id);

        if (!string.IsNullOrWhiteSpace(request.Name))
            location.Name = request.Name.Trim();

        if (!string.IsNullOrWhiteSpace(request.FacilityType))
            location.FacilityType = request.FacilityType.Trim();

        if (!string.IsNullOrWhiteSpace(request.Address))
            location.Address = request.Address.Trim();

        if (!string.IsNullOrWhiteSpace(request.City))
            location.City = request.City.Trim();

        if (request.PostalCode != null)
            location.PostalCode = request.PostalCode.Trim();

        if (!string.IsNullOrWhiteSpace(request.Phone))
            location.Phone = request.Phone.Trim();

        if (request.IpGuardExtension != null)
            location.IpGuardExtension = request.IpGuardExtension.Trim();

        if (request.SecurityNotes != null)
            location.SecurityNotes = request.SecurityNotes.Trim();

        if (request.EstimatedStaffCapacity != null)
            location.EstimatedStaffCapacity = request.EstimatedStaffCapacity.Trim();

        if (request.AvailableFloors != null)
            location.AvailableFloors = request.AvailableFloors.Trim();

        if (request.CustodianId.HasValue)
            location.CustodianId = request.CustodianId.Value > 0 ? request.CustodianId.Value : null;

        if (request.IsActive.HasValue)
            location.IsActive = request.IsActive.Value;

        if (request.Areas != null)
        {
            var requestedAreaNames = request.Areas
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => a.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            foreach (var existing in location.Areas)
            {
                if (!requestedAreaNames.Contains(existing.Name, StringComparer.OrdinalIgnoreCase))
                {
                    existing.IsActive = false;
                }
            }

            foreach (var name in requestedAreaNames)
            {
                var existing = location.Areas.FirstOrDefault(a => string.Equals(a.Name, name, StringComparison.OrdinalIgnoreCase));
                if (existing != null)
                {
                    existing.IsActive = true;
                }
                else
                {
                    location.Areas.Add(new LocationArea
                    {
                        LocationId = location.Id,
                        Name = name,
                        IsActive = true
                    });
                }
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new LocationDto
        {
            Id = location.Id,
            Code = location.Code,
            Name = location.Name,
            FacilityType = location.FacilityType,
            Address = location.Address,
            City = location.City,
            PostalCode = location.PostalCode,
            Phone = location.Phone,
            IpGuardExtension = location.IpGuardExtension,
            SecurityNotes = location.SecurityNotes,
            EstimatedStaffCapacity = location.EstimatedStaffCapacity,
            AvailableFloors = location.AvailableFloors,
            CustodianId = location.CustodianId,
            CustodianName = location.Custodian?.Name,
            IsActive = location.IsActive,
            Areas = location.Areas.Where(a => a.IsActive).Select(a => new LocationAreaDto
            {
                Id = a.Id,
                LocationId = a.LocationId,
                Name = a.Name,
                FloorOrBlock = a.FloorOrBlock,
                IsActive = a.IsActive
            }).ToList()
        };

        return ApiResponse<LocationDto>.Ok(dto, "Sede actualizada exitosamente");
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
