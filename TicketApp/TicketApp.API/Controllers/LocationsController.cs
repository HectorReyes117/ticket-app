using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketApp.API.Controllers.Common;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Locations.DTOs;

namespace TicketApp.API.Controllers;

[Authorize]
public class LocationsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<LocationDto>>>> GetLocations(
        [FromQuery] string? search,
        [FromQuery] bool? activeOnly,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await Mediator.Send(new GetLocationsQuery
        {
            Search = search,
            ActiveOnly = activeOnly,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<LocationDto>>> CreateLocation([FromBody] CreateLocationCommand command)
    {
        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetLocations), new { id = result.Data?.Id }, result);
    }

    [HttpPost("{id:int}/areas")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<LocationAreaDto>>> CreateLocationArea(int id, [FromBody] CreateLocationAreaRequest request)
    {
        var command = new CreateLocationAreaCommand
        {
            LocationId = id,
            Name = request.Name,
            FloorOrBlock = request.FloorOrBlock
        };

        var result = await Mediator.Send(command);
        return Ok(result);
    }
}

public class CreateLocationAreaRequest
{
    public string Name { get; set; } = string.Empty;
    public string? FloorOrBlock { get; set; }
}
