namespace TicketApp.Application.Features.Auth.DTOs;

public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class ValidateResetTokenDto
{
    public string Token { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ResetPasswordResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
