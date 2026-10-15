import { STATUS_META, TICKET_STATUSES, PRIORITY_META } from "@/utils";
import type { Priority, Ticket, TicketStatus, User } from "@/types";
import type { FilterPill } from "@/components/common/FilterPills";

/**
 * Quick filters that come from the design and are not plain ticket statuses.
 * `unassigned` = no assignee, `urgent` = high/critical priority, `closed` = a terminal status.
 */
export type TicketQuickFilter = "unassigned" | "urgent" | "closed";

/** The single-select pill row: `all`, a real status, or a design quick filter. */
export type TicketPillFilter = "all" | TicketStatus | TicketQuickFilter;

export type TicketSortKey = "recent" | "oldest" | "priority" | "sla";

export interface TicketQueryState {
  pill: TicketPillFilter;
  priority: Priority | "all";
  area: string | "all";
  technicianId: string | "all";
  siteId: string | "all";
  search: string;
  sort: TicketSortKey;
}

export const DEFAULT_TICKET_QUERY: TicketQueryState = {
  pill: "all",
  priority: "all",
  area: "all",
  technicianId: "all",
  siteId: "all",
  search: "",
  sort: "recent",
};

/** `Urgentes` in the design: the two highest priority levels. */
export const URGENT_PRIORITIES: Priority[] = ["high", "critical"];

/** `Cerradas` in the design: the two terminal statuses. */
export const CLOSED_STATUSES: TicketStatus[] = ["resolved", "cancelled"];

/** Statuses that still need work, i.e. what "Tickets abiertos" counts. */
export const OPEN_STATUSES: TicketStatus[] = ["pending", "in_progress", "on_hold"];

/**
 * Inclusive created-at window. Owned by the page (header date-range filter) rather than by
 * the toolbar, so it travels through `TicketQueryContext` and still shapes the faceted pill counts.
 * The optional `| undefined` unions keep it assignable from react-day-picker's `DateRange`.
 */
export interface TicketDateRange {
  from?: Date | undefined;
  to?: Date | undefined;
}

export const TICKET_SORT_OPTIONS: Array<{ value: TicketSortKey; label: string }> = [
  { value: "recent", label: "Más recientes" },
  { value: "oldest", label: "Más antiguas" },
  { value: "priority", label: "Prioridad (mayor)" },
  { value: "sla", label: "SLA por vencer" },
];

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * The design shows `Filas por página: 20`, but the seeded data set only holds 14 tickets,
 * so a 20-row page would always render a single page and hide the pagination controls.
 * 10 keeps the feature observable with the current data.
 */
export const DEFAULT_PAGE_SIZE = 10;

const QUICK_FILTERS: TicketQuickFilter[] = ["unassigned", "urgent", "closed"];

export function isQuickFilter(value: string): value is TicketQuickFilter {
  return (QUICK_FILTERS as string[]).includes(value);
}

export function matchesPill(ticket: Ticket, pill: TicketPillFilter): boolean {
  if (pill === "all") return true;
  if (pill === "unassigned") return !ticket.assigneeId;
  if (pill === "urgent") return URGENT_PRIORITIES.includes(ticket.priority);
  if (pill === "closed") return CLOSED_STATUSES.includes(ticket.status);
  return ticket.status === pill;
}

export interface TicketQueryContext {
  usersById: Record<string, User | undefined>;
  createdRange?: TicketDateRange;
}

/** Day bounds are inclusive: `from` starts at 00:00:00.000 and `to` ends at 23:59:59.999. */
export function isWithinRange(
  value: string | number | Date,
  range: TicketDateRange | undefined,
): boolean {
  if (!range || (!range.from && !range.to)) return true;

  const time = new Date(value).getTime();
  if (range.from) {
    const start = new Date(range.from);
    start.setHours(0, 0, 0, 0);
    if (time < start.getTime()) return false;
  }
  if (range.to) {
    const end = new Date(range.to);
    end.setHours(23, 59, 59, 999);
    if (time > end.getTime()) return false;
  }
  return true;
}

export function matchesQuery(
  ticket: Ticket,
  query: TicketQueryState,
  { usersById, createdRange }: TicketQueryContext,
  options: { ignorePill?: boolean } = {},
): boolean {
  if (!options.ignorePill && !matchesPill(ticket, query.pill)) return false;
  if (!isWithinRange(ticket.createdAt, createdRange)) return false;
  if (query.priority !== "all" && ticket.priority !== query.priority) return false;
  if (query.area !== "all" && ticket.area !== query.area) return false;
  if (query.siteId !== "all" && ticket.siteId !== query.siteId) return false;
  if (query.technicianId !== "all" && ticket.assigneeId !== query.technicianId) {
    return false;
  }

  const search = query.search.trim().toLowerCase();
  if (search) {
    const requestor = usersById[ticket.requestorId]?.name.toLowerCase() ?? "";
    const assignee = ticket.assigneeId
      ? (usersById[ticket.assigneeId]?.name.toLowerCase() ?? "")
      : "";
    const haystack =
      `${ticket.id} ${ticket.title} ${ticket.category} ${ticket.subcategory} ` +
      `${ticket.area} ${requestor} ${assignee}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  return true;
}

export function sortTickets(tickets: Ticket[], sort: TicketSortKey): Ticket[] {
  const sorted = [...tickets];
  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "priority":
      return sorted.sort(
        (a, b) =>
          PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank ||
          b.createdAt.localeCompare(a.createdAt),
      );
    case "sla":
      return sorted.sort((a, b) => a.slaDueAt.localeCompare(b.slaDueAt));
    case "recent":
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function applyTicketQuery(
  tickets: Ticket[],
  query: TicketQueryState,
  context: TicketQueryContext,
): Ticket[] {
  return sortTickets(
    tickets.filter((ticket) => matchesQuery(ticket, query, context)),
    query.sort,
  );
}

/**
 * Faceted pill counts: every dimension except the pill itself is applied first, so
 * the numbers never contradict what the other controls already narrowed down.
 */
export function buildPillOptions(
  tickets: Ticket[],
  query: TicketQueryState,
  context: TicketQueryContext,
): FilterPill[] {
  const base = tickets.filter((ticket) =>
    matchesQuery(ticket, query, context, { ignorePill: true }),
  );

  const counts: Record<string, number> = { all: base.length };
  const bump = (key: string) => {
    counts[key] = (counts[key] ?? 0) + 1;
  };

  for (const ticket of base) {
    bump(ticket.status);
    if (!ticket.assigneeId) bump("unassigned");
    if (URGENT_PRIORITIES.includes(ticket.priority)) bump("urgent");
    if (CLOSED_STATUSES.includes(ticket.status)) bump("closed");
  }

  return [
    { value: "all", label: `Todas (${counts.all ?? 0})` },
    { value: "unassigned", label: `Sin asignar (${counts.unassigned ?? 0})` },
    { value: "urgent", label: `Urgentes (${counts.urgent ?? 0})` },
    { value: "closed", label: `Cerradas (${counts.closed ?? 0})` },
    ...TICKET_STATUSES.map((status) => ({
      value: status,
      label: `${STATUS_META[status].label} (${counts[status] ?? 0})`,
    })),
  ];
}

export function hasActiveFilters(query: TicketQueryState): boolean {
  return (
    query.pill !== "all" ||
    query.priority !== "all" ||
    query.area !== "all" ||
    query.technicianId !== "all" ||
    query.siteId !== "all" ||
    query.search.trim().length > 0
  );
}

export interface TicketSummaryStats {
  /** Every ticket in scope. */
  total: number;
  /** Not yet terminal: pending, in progress or on hold. */
  open: number;
  /** Created within the last 24 hours. */
  createdLast24h: number;
  inProgress: number;
  resolved: number;
}

/**
 * Headline counts for the KPI cards above the table. `now` is injectable so the
 * "last 24 hours" window can be pinned in a probe or a test.
 */
export function summarizeTickets(
  tickets: Ticket[],
  now: Date = new Date(),
): TicketSummaryStats {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  let open = 0;
  let createdLast24h = 0;
  let inProgress = 0;
  let resolved = 0;

  for (const ticket of tickets) {
    if (OPEN_STATUSES.includes(ticket.status)) open += 1;
    if (new Date(ticket.createdAt).getTime() >= cutoff) createdLast24h += 1;
    if (ticket.status === "in_progress") inProgress += 1;
    if (ticket.status === "resolved") resolved += 1;
  }

  return { total: tickets.length, open, createdLast24h, inProgress, resolved };
}

export const DISTRIBUTION_PERIODS = ["month", "week", "all"] as const;

export type DistributionPeriod = (typeof DISTRIBUTION_PERIODS)[number];

export const DISTRIBUTION_PERIOD_LABELS: Record<DistributionPeriod, string> = {
  month: "Este mes",
  week: "Últimos 7 días",
  all: "Todo el tiempo",
};

/** Narrows tickets to the distribution chart's period, measured from `createdAt`. */
export function filterByPeriod(
  tickets: Ticket[],
  period: DistributionPeriod,
  now: Date = new Date(),
): Ticket[] {
  if (period === "all") return tickets;

  const from = new Date(now);
  if (period === "week") {
    from.setDate(from.getDate() - 7);
  } else {
    from.setDate(1);
  }
  from.setHours(0, 0, 0, 0);

  const cutoff = from.getTime();
  return tickets.filter(
    (ticket) => new Date(ticket.createdAt).getTime() >= cutoff,
  );
}

/** Status breakdown for the distribution donut, keeping empty statuses so the legend is stable. */
export function countByStatus(
  tickets: Ticket[],
): Array<{ status: TicketStatus; count: number }> {
  return TICKET_STATUSES.map((status) => ({
    status,
    count: tickets.filter((ticket) => ticket.status === status).length,
  }));
}

export interface TicketSlaSummary {
  /** Resolved tickets in scope, i.e. the compliance base. */
  resolved: number;
  /** Of those, how many finished at or before their due date. */
  compliant: number;
  /** `null` when nothing was resolved, so the UI never shows a fake 0% or 100%. */
  percentage: number | null;
}

/**
 * SLA compliance for the distribution card footer. `Ticket` has no `resolvedAt`, so `updatedAt`
 * is used as the resolution stamp — the best available approximation for a resolved ticket.
 */
export function summarizeSla(tickets: Ticket[]): TicketSlaSummary {
  const resolved = tickets.filter((ticket) => ticket.status === "resolved");
  const compliant = resolved.filter(
    (ticket) =>
      new Date(ticket.updatedAt).getTime() <= new Date(ticket.slaDueAt).getTime(),
  );

  return {
    resolved: resolved.length,
    compliant: compliant.length,
    percentage:
      resolved.length === 0
        ? null
        : Math.round((compliant.length / resolved.length) * 100),
  };
}
