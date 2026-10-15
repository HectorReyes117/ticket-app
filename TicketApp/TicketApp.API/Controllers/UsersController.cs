using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketApp.API.Controllers.Common;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Users.DTOs;
using TicketApp.Domain.Enums;

namespace TicketApp.API.Controllers;

[Authorize]
public class UsersController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDto>>>> GetUsers([FromQuery] UserRole? role, [FromQuery] int? locationId, [FromQuery] bool? activeOnly)
    {
        var result = await Mediator.Send(new GetUsersQuery
        {
            Role = role,
            LocationId = locationId,
            ActiveOnly = activeOnly
        });
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(int id)
    {
        var result = await Mediator.Send(new GetUserByIdQuery(id));
        return Ok(result);
    }

    [HttpGet("technicians")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDto>>>> GetTechnicians()
    {
        var result = await Mediator.Send(new GetUsersQuery
        {
            Role = UserRole.Technician,
            ActiveOnly = true
        });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser([FromBody] CreateUserCommand command)
    {
        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetUserById), new { id = result.Data?.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(int id, [FromBody] UpdateUserCommand command)
    {
        command.Id = id;
        var result = await Mediator.Send(command);
        return Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleUserStatus(int id, [FromBody] ToggleUserStatusCommand command)
    {
        command.Id = id;
        var result = await Mediator.Send(command);
        return Ok(result);
    }
}
