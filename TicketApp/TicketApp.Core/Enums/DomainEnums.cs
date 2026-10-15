using System.ComponentModel;

namespace TicketApp.Domain.Enums;

public enum TicketStatus
{
    [Description("Pendiente")]
    Pending = 1,

    [Description("En Proceso")]
    InProgress = 2,

    [Description("En Espera")]
    OnHold = 3,

    [Description("Resuelto")]
    Resolved = 4,

    [Description("Cancelado")]
    Cancelled = 5
}

public enum Priority
{
    [Description("Baja")]
    Low = 1,

    [Description("Media")]
    Medium = 2,

    [Description("Alta")]
    High = 3,

    [Description("Crítica")]
    Critical = 4
}

public enum UserRole
{
    [Description("Solicitante")]
    Requestor = 1,

    [Description("Técnico")]
    Technician = 2,

    [Description("Administrador")]
    Admin = 3,

    [Description("Director")]
    Director = 4
}

public enum UserPresence
{
    [Description("En línea")]
    Online = 1,

    [Description("Ocupado")]
    Busy = 2,

    [Description("Desconectado")]
    Offline = 3
}

public enum ActivityType
{
    [Description("Creación")]
    Created = 1,

    [Description("Cambio de Estado")]
    StatusChange = 2,

    [Description("Asignación")]
    Assignment = 3,

    [Description("Nota Interna")]
    Note = 4,

    [Description("Respuesta Pública")]
    PublicResponse = 5,

    [Description("Escalación")]
    Escalation = 6,

    [Description("Archivo Adjunto")]
    Attachment = 7
}
