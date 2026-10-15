using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Application.Common.Models;
using TicketApp.Domain.Entities;

namespace TicketApp.Application.Features.Departments.DTOs;

public class DepartmentDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class GetDepartmentsQuery : IRequest<ApiResponse<IReadOnlyList<DepartmentDto>>>
{
}

public class GetDepartmentsQueryHandler : IRequestHandler<GetDepartmentsQuery, ApiResponse<IReadOnlyList<DepartmentDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDepartmentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<IReadOnlyList<DepartmentDto>>> Handle(GetDepartmentsQuery request, CancellationToken cancellationToken)
    {
        var list = await _unitOfWork.Repository<Department>()
            .Query()
            .Where(d => d.IsActive)
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                Code = d.Code,
                Name = d.Name,
                IsActive = d.IsActive
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<DepartmentDto>>.Ok(list);
    }
}
