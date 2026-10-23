using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TicketApp.Application.Common.Interfaces;
using TicketApp.Domain.Entities;
using TicketApp.Infrastructure.Helpers;

namespace TicketApp.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var rawSecret = _configuration["JwtSettings:Secret"] ?? "JWT_SECRET";
        var secretKey = ConfigurationHelper.ResolveEnvValue(rawSecret, "TicketApp_Super_Secret_Jwt_Security_Key_2026_Unicaribe_Development_Key!");
        var issuer = ConfigurationHelper.ResolveEnvValue(_configuration["JwtSettings:Issuer"], "TicketAppApi");
        var audience = ConfigurationHelper.ResolveEnvValue(_configuration["JwtSettings:Audience"], "TicketAppClient");
        var durationMinutes = double.TryParse(_configuration["JwtSettings:DurationInMinutes"], out var minutes) ? minutes : 480;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role.ToString().ToLower()),
            new("employeeCode", user.EmployeeCode),
            new("roleName", user.Role.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(durationMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, 11);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch
        {
            return false;
        }
    }
}
