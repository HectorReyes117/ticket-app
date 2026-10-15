export const APP_CONFIG = {
  name: "TicketApp",
  systemName: "Sistema de Solicitudes de Servicios",
  version: "1.0.0",
  defaultPageSize: 10,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  ticketIdPrefix: "REQ",
} as const;