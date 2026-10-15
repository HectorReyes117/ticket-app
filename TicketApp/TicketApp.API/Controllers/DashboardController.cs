using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketApp.API.Controllers.Common;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Dashboard.DTOs;

namespace TicketApp.API.Controllers;

[Authorize]
public class DashboardController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<DashboardDataDto>>> GetDashboardData()
    {
        var result = await Mediator.Send(new GetDashboardDataQuery());
        return Ok(result);
    }
}
