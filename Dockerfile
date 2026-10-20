# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for caching restore layer
COPY ["TicketApp/TicketApp.Core/TicketApp.Domain.csproj", "TicketApp/TicketApp.Core/"]
COPY ["TicketApp/TicketApp.Application/TicketApp.Application.csproj", "TicketApp/TicketApp.Application/"]
COPY ["TicketApp/TicketApp.Infrastructure/TicketApp.Infrastructure.csproj", "TicketApp/TicketApp.Infrastructure/"]
COPY ["TicketApp/TicketApp.API/TicketApp.API.csproj", "TicketApp/TicketApp.API/"]

RUN dotnet restore "TicketApp/TicketApp.API/TicketApp.API.csproj"

# Copy all source code
COPY TicketApp/ TicketApp/

WORKDIR "/src/TicketApp/TicketApp.API"
RUN dotnet publish "TicketApp.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Ensure uploads directories exist for static files and avatars/evidences
RUN mkdir -p /app/wwwroot/uploads/avatars /app/wwwroot/uploads/evidences

COPY --from=build /app/publish .

# Render exposes PORT env var (defaults to 8080)
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "TicketApp.API.dll"]
