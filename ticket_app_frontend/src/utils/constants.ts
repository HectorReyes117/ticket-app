import type {
  ActivityType,
  Priority,
  Role,
  TicketStatus,
} from "@/types";

export const TICKET_ID_PREFIX = "REQ";

export const STATUS_META: Record<
  TicketStatus,
  { label: string; badge: string; dot: string }
> = {
  pending: {
    label: "Pendiente",
    badge:
      "border-status-pending-border bg-status-pending-bg text-status-pending-fg",
    dot: "bg-status-pending",
  },
  in_progress: {
    label: "En Proceso",
    badge:
      "border-status-in-progress-border bg-status-in-progress-bg text-status-in-progress-fg",
    dot: "bg-status-in-progress",
  },
  on_hold: {
    label: "En Espera",
    badge:
      "border-status-on-hold-border bg-status-on-hold-bg text-status-on-hold-fg",
    dot: "bg-status-on-hold",
  },
  resolved: {
    label: "Resuelto",
    badge:
      "border-status-resolved-border bg-status-resolved-bg text-status-resolved-fg",
    dot: "bg-status-resolved",
  },
  cancelled: {
    label: "Cancelado",
    badge:
      "border-status-cancelled-border bg-status-cancelled-bg text-status-cancelled-fg",
    dot: "bg-status-cancelled",
  },
};

export const TICKET_STATUSES = Object.keys(STATUS_META) as TicketStatus[];

export const PRIORITY_META: Record<
  Priority,
  { label: string; badge: string; bars: string; rank: 1 | 2 | 3 | 4 }
> = {
  low: { label: "Baja", badge: "bg-priority-low-bg text-priority-low", bars: "bg-priority-low", rank: 1 },
  medium: { label: "Media", badge: "bg-priority-medium-bg text-priority-medium", bars: "bg-priority-medium", rank: 2 },
  high: { label: "Alta", badge: "bg-priority-high-bg text-priority-high", bars: "bg-priority-high", rank: 3 },
  critical: { label: "Crítica", badge: "bg-priority-critical-bg text-priority-critical", bars: "bg-priority-critical", rank: 4 },
};

export const PRIORITIES = Object.keys(PRIORITY_META) as Priority[];

export const ROLE_META: Record<Role, { label: string }> = {
  requestor: { label: "Solicitante" },
  technician: { label: "Soporte Técnico" },
  admin: { label: "Administrador" },
  director: { label: "Director" },
};

export const ROLES = Object.keys(ROLE_META) as Role[];

export const ACTIVITY_TYPE_META: Record<
  ActivityType,
  { label: string; shortLabel: string }
> = {
  created: { label: "Solicitud creada", shortLabel: "Creación" },
  status_change: { label: "Cambio de estado", shortLabel: "Estado" },
  assignment: { label: "Asignación", shortLabel: "Asignación" },
  note: { label: "Nota interna", shortLabel: "Nota" },
  public_response: { label: "Respuesta al solicitante", shortLabel: "Respuesta" },
  escalation: { label: "Escalación de SLA", shortLabel: "Escalación" },
  attachment: { label: "Adjunto agregado", shortLabel: "Adjunto" },
};

export const SERVICE_CATEGORIES = [
  { label: "Soporte de Escritorio", options: ["Configuración de equipo", "Falla de hardware", "Periféricos"] },
  { label: "Redes y Conectividad", options: ["Sin acceso a internet", "Red inalámbrica", "Cableado"] },
  { label: "Aplicaciones y Software", options: ["Instalación", "Licenciamiento", "Error de aplicación"] },
  { label: "Correo y Colaboración", options: ["Correo electrónico", "Calendario", "Acceso VPN"] },
  { label: "Impresión y Digitalización", options: ["Impresora", "Digitalización", "Toner"] },
  { label: "Seguridad y Accesos", options: ["Credenciales", "Acceso a sistemas", "Tarjeta de acceso"] },
  { label: "Infraestructura", options: ["Aulas y laboratorios", "Proyectores", "Energía"] },
  { label: "Otros", options: ["Otra consulta"] },
] as const;

export const SLA_HOURS: Record<Priority, number> = {
  low: 48,
  medium: 24,
  high: 8,
  critical: 4,
};