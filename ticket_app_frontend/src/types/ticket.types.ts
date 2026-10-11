import type { Site } from "./site.types";
import type { User } from "./user.types";

export type TicketStatus =
  | "pending"
  | "in_progress"
  | "on_hold"
  | "resolved"
  | "cancelled";

export type Priority = "low" | "medium" | "high" | "critical";

export type ActivityType =
  | "created"
  | "status_change"
  | "assignment"
  | "note"
  | "public_response"
  | "escalation"
  | "attachment";

export interface TicketActivity {
  id: string;
  type: ActivityType;
  authorId: string;
  createdAt: string;
  message: string;
  public: boolean;
}

export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedById: string;
}

export interface Ticket {
  id: string;
  sequence: number;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: Priority;
  status: TicketStatus;
  requestorId: string;
  assigneeId?: string;
  siteId: string;
  area: string;
  createdAt: string;
  updatedAt: string;
  slaDueAt: string;
  resolution?: string;
  attachments: TicketAttachment[];
  activities: TicketActivity[];
}

export type TicketSummary = Pick<
  Ticket,
  | "id"
  | "sequence"
  | "title"
  | "priority"
  | "status"
  | "assigneeId"
  | "siteId"
  | "createdAt"
  | "slaDueAt"
>;

export interface TicketDraft {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: Priority;
  requestorId: string;
  siteId: string;
  area: string;
}

export type TicketView = "table" | "kanban";

export interface TicketFilters {
  search: string;
  status: TicketStatus | "all";
  priority: Priority | "all";
  siteId: string | "all";
  assigneeId: string | "all";
}

export type { Site, User };