import { TICKET_ID_PREFIX } from "./constants";

const esDateTime = (opts: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  });

export function formatTicketId(sequence: number): string {
  return `${TICKET_ID_PREFIX}-${String(sequence).padStart(5, "0")}`;
}

export function parseDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    // If it's an ISO format without timezone offset (e.g. 2026-10-15T23:30:00), append Z so it's treated as UTC
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)) {
      return new Date(`${trimmed}Z`);
    }
    return new Date(trimmed);
  }
  return new Date();
}

export function formatDate(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return esDateTime({ hour12: false, ...options }).format(parseDate(value));
}

export function formatDateTime(
  value: string | number | Date,
): string {
  return esDateTime({
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parseDate(value));
}

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

export function formatRelativeTime(value: string | number | Date): string {
  const diffMs = parseDate(value).getTime() - Date.now();
  const absSeconds = Math.abs(Math.round(diffMs / 1000));

  if (absSeconds < 60) return "hace un momento";
  const absMinutes = Math.round(absSeconds / 60);
  if (absMinutes < 60) return rtf.format(-absMinutes, "minute");
  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) return rtf.format(-absHours, "hour");
  const absDays = Math.round(absHours / 24);
  if (absDays < 30) return rtf.format(-absDays, "day");
  const absMonths = Math.round(absDays / 30);
  return rtf.format(-absMonths, "month");
}

export interface SlaResult {
  label: string;
  overdue: boolean;
  warning: boolean;
  hoursLeft: number;
  minutesLeft: number;
}

export function formatSla(dueAt: string | number | Date): SlaResult {
  const diffMs = parseDate(dueAt).getTime() - Date.now();
  const overdue = diffMs < 0;
  const totalMinutes = Math.abs(Math.round(diffMs / 60000));
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;

  let label: string;
  if (overdue) {
    if (hoursLeft > 0) label = `vencido hace ${hoursLeft}h ${minutesLeft}m`;
    else label = `vencido hace ${minutesLeft}m`;
  } else if (hoursLeft > 0) {
    label = `restan ${hoursLeft}h ${minutesLeft}m`;
  } else {
    label = `restan ${minutesLeft}m`;
  }

  return { label, overdue, hoursLeft, minutesLeft, warning: !overdue && hoursLeft < 1 };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function padStart(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}