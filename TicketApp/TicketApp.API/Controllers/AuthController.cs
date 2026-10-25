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

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ResetPasswordResultDto>>> ForgotPassword([FromBody] ForgotPasswordCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }

    [HttpGet("validate-reset-token")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> ValidateResetToken([FromQuery] string token)
    {
        var result = await Mediator.Send(new ValidateResetTokenQuery(token));
        return Ok(result);
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ResetPasswordResultDto>>> ResetPassword([FromBody] ResetPasswordCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("change-initial-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> ChangeInitialPassword([FromBody] ChangeInitialPasswordCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }
}
