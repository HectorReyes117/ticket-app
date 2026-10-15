using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketApp.API.Controllers.Common;
using TicketApp.Application.Common.Models;
using TicketApp.Application.Features.Tickets.Commands.AddTicketActivity;
using TicketApp.Application.Features.Tickets.Commands.AssignTicket;
using TicketApp.Application.Features.Tickets.Commands.CreateTicket;
using TicketApp.Application.Features.Tickets.Commands.UpdateTicketStatus;
using TicketApp.Application.Features.Tickets.Commands.UploadAttachment;
using TicketApp.Application.Features.Tickets.DTOs;
using TicketApp.Application.Features.Tickets.Queries.GetTicketById;
using TicketApp.Application.Features.Tickets.Queries.GetTickets;
using TicketApp.Domain.Enums;

namespace TicketApp.API.Controllers;

[Authorize]
public class TicketsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<TicketSummaryDto>>>> GetTickets([FromQuery] GetTicketsQuery query)
    {
        var result = await Mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> GetTicketById(int id)
    {
        var result = await Mediator.Send(new GetTicketByIdQuery(id));
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TicketDto>>> CreateTicket([FromBody] CreateTicketCommand command)
    {
        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetTicketById), new { id = result.Data?.Id }, result);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var command = new UpdateTicketStatusCommand
        {
            TicketId = id,
            NewStatus = request.NewStatus,
            ResolutionSummary = request.ResolutionSummary,
            Note = request.Note
        };

        var result = await Mediator.Send(command);
        return Ok(result);
    }

    [HttpPatch("{id:int}/assign")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> AssignTicket(int id, [FromBody] AssignTicketRequest request)
    {
        var command = new AssignTicketCommand
        {
            TicketId = id,
            AssigneeId = request.AssigneeId
        };

        var result = await Mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("{id:int}/activities")]
    public async Task<ActionResult<ApiResponse<TicketActivityDto>>> AddActivity(int id, [FromBody] AddActivityRequest request)
    {
        var command = new AddTicketActivityCommand
        {
            TicketId = id,
            ActivityType = request.ActivityType,
            Message = request.Message,
            IsPublic = request.IsPublic
        };

        var result = await Mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("{id:int}/attachments")]
    public async Task<ActionResult<ApiResponse<AttachmentDto>>> UploadAttachment(int id, [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<AttachmentDto>.Fail("No se proporcionó ningún archivo válido."));
        }

        using var stream = file.OpenReadStream();
        var command = new UploadTicketAttachmentCommand
        {
            TicketId = id,
            FileStream = stream,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileLength = file.Length
        };

        var result = await Mediator.Send(command);
        return Ok(result);
    }
}

public class UpdateStatusRequest
{
    public TicketStatus NewStatus { get; set; }
    public string? ResolutionSummary { get; set; }
    public string? Note { get; set; }
}

public class AssignTicketRequest
{
    public int AssigneeId { get; set; }
}

public class AddActivityRequest
{
    public ActivityType ActivityType { get; set; } = ActivityType.Note;
    public string Message { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
}
