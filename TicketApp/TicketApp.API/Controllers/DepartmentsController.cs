using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketApp.API.Controllers.Common;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Departments.DTOs;

namespace TicketApp.API.Controllers;

[Authorize]
public class DepartmentsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DepartmentDto>>>> GetDepartments()
    {
        var result = await Mediator.Send(new GetDepartmentsQuery());
        return Ok(result);
    }
}
