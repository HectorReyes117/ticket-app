# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for caching restore layer
COPY ["TicketApp.Core/TicketApp.Domain.csproj", "TicketApp.Core/"]
COPY ["TicketApp.Application/TicketApp.Application.csproj", "TicketApp.Application/"]
COPY ["TicketApp.Infrastructure/TicketApp.Infrastructure.csproj", "TicketApp.Infrastructure/"]
COPY ["TicketApp.API/TicketApp.API.csproj", "TicketApp.API/"]

RUN dotnet restore "TicketApp.API/TicketApp.API.csproj"

# Copy all source code
COPY . .

WORKDIR "/src/TicketApp.API"
RUN dotnet publish "TicketApp.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Ensure uploads directories exist for static files and avatars/evidences
RUN mkdir -p /app/wwwroot/uploads/avatars /app/wwwroot/uploads/evidences

COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "TicketApp.API.dll"]
