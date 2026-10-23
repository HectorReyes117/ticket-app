namespace TicketApp.Infrastructure.Helpers;

public static class ConfigurationHelper
{
    /// <summary>
    /// Resuelve el valor de una configuración: si el valor configurado corresponde
    /// al nombre de una variable de entorno, obtiene el valor de dicha variable de entorno.
    /// De lo contrario, retorna el valor configurado o el fallback.
    /// </summary>
    public static string ResolveEnvValue(string? configuredValue, string fallback = "")
    {
        if (string.IsNullOrWhiteSpace(configuredValue))
            return fallback;

        var trimmed = configuredValue.Trim();

        // 1. Revisar si el valor es el nombre de una variable de entorno existente
        var fromProcess = Environment.GetEnvironmentVariable(trimmed, EnvironmentVariableTarget.Process);
        if (!string.IsNullOrEmpty(fromProcess))
            return fromProcess;

        var fromMachine = Environment.GetEnvironmentVariable(trimmed, EnvironmentVariableTarget.Machine);
        if (!string.IsNullOrEmpty(fromMachine))
            return fromMachine;

        var fromUser = Environment.GetEnvironmentVariable(trimmed, EnvironmentVariableTarget.User);
        if (!string.IsNullOrEmpty(fromUser))
            return fromUser;

        // 2. Si no es una variable de entorno activa, retornar el valor tal cual
        return trimmed;
    }
}
