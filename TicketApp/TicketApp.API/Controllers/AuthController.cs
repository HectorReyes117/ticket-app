using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketApp.API.Controllers.Common;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Auth.Commands;
using TicketApp.Application.Features.Auth.DTOs;
using TicketApp.Application.Features.Auth.Queries;

namespace TicketApp.API.Controllers;

public class AuthController : BaseApiController
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetCurrentUser()
    {
        var result = await Mediator.Send(new GetCurrentUserQuery());
        return Ok(result);
    }
}
