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
}

export function matchesQuery(
  ticket: Ticket,
  query: TicketQueryState,
  { usersById }: TicketQueryContext,
  options: { ignorePill?: boolean } = {},
): boolean {
  if (!options.ignorePill && !matchesPill(ticket, query.pill)) return false;
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
