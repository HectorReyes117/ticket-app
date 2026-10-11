import { mockApi } from "@/services/api";
import { mockTickets } from "../data/mockTickets";
import { ACTIVITY_TYPE_META, SLA_HOURS } from "@/utils";
import type {
  ActivityType,
  Priority,
  Ticket,
  TicketActivity,
  TicketDraft,
  TicketStatus,
} from "@/types";

const randomId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export function nextSequence(tickets: Ticket[]): number {
  return tickets.reduce((max, t) => Math.max(max, t.sequence), 10000) + 1;
}

export function computeSlaDueAt(priority: Priority): string {
  return new Date(Date.now() + SLA_HOURS[priority] * 3_600_000).toISOString();
}

export function buildActivity(
  type: ActivityType,
  authorId: string,
  message?: string,
): TicketActivity {
  return {
    id: randomId("act"),
    type,
    authorId,
    createdAt: new Date().toISOString(),
    message: message ?? ACTIVITY_TYPE_META[type].label,
    public: true,
  };
}

export function createTicketFromDraft(
  draft: TicketDraft,
  tickets: Ticket[],
): Ticket {
  const sequence = nextSequence(tickets);
  return {
    id: `ticket-${sequence}`,
    sequence,
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    subcategory: draft.subcategory,
    priority: draft.priority,
    status: "pending",
    requestorId: draft.requestorId,
    siteId: draft.siteId,
    area: draft.area,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slaDueAt: computeSlaDueAt(draft.priority),
    attachments: [],
    activities: [
      buildActivity("created", draft.requestorId, "Solicitud creada desde el portal de servicios."),
    ],
  };
}

export function applyStatusTransition(
  ticket: Ticket,
  status: TicketStatus,
  actorId: string,
  message?: string,
): Ticket {
  return {
    ...ticket,
    status,
    updatedAt: new Date().toISOString(),
    resolution:
      status === "resolved"
        ? message?.trim() || "Solicitud resuelta."
        : status === "cancelled"
          ? message?.trim() || "Solicitud cancelada."
          : ticket.resolution,
    activities: [
      ...ticket.activities,
      buildActivity("status_change", actorId, message),
    ],
  };
}

export function applyAssignment(
  ticket: Ticket,
  assigneeId: string,
  actorId: string,
): Ticket {
  return {
    ...ticket,
    assigneeId,
    updatedAt: new Date().toISOString(),
    activities: [
      ...ticket.activities,
      buildActivity("assignment", actorId),
    ],
  };
}

export function applyNote(
  ticket: Ticket,
  authorId: string,
  message: string,
  isPublic = false,
): Ticket {
  return {
    ...ticket,
    updatedAt: new Date().toISOString(),
    activities: [
      ...ticket.activities,
      {
        ...buildActivity(isPublic ? "public_response" : "note", authorId, message),
        public: isPublic,
      },
    ],
  };
}

export function listMockTickets(): Promise<Ticket[]> {
  return mockApi(mockTickets);
}

export function getMockTicket(id: string): Promise<Ticket | undefined> {
  return mockApi(mockTickets.find((t) => t.id === id));
}