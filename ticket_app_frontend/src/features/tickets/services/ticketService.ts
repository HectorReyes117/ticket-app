import { api } from "@/services/api";
import type {
  ActivityType,
  Priority,
  Ticket,
  TicketActivity,
  TicketAttachment,
  TicketDraft,
  TicketStatus,
} from "@/types";

export interface BackendAttachmentDto {
  id: number;
  ticketId: number;
  uploadedById: number;
  uploadedByName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface BackendActivityDto {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  authorAvatarUrl?: string;
  activityType: string;
  activityTypeDescription: string;
  message: string;
  isPublic: boolean;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface BackendTicketSummaryDto {
  id: number;
  sequence: number;
  code: string;
  title: string;
  category: string;
  priority: string;
  priorityDescription: string;
  status: string;
  statusDescription: string;
  locationId?: number;
  locationName: string;
  requesterId?: number;
  requesterName: string;
  requesterAvatarUrl?: string;
  assigneeId?: number;
  assigneeName?: string;
  assigneeAvatarUrl?: string;
  createdAt: string;
  slaDueAt: string;
}

export interface BackendTicketDto {
  id: number;
  sequence: number;
  code: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: string;
  priorityDescription: string;
  status: string;
  statusDescription: string;
  locationId: number;
  locationName: string;
  locationAreaId?: number;
  locationAreaName?: string;
  requesterId: number;
  requesterName: string;
  requesterEmail: string;
  requesterAvatarUrl?: string;
  assigneeId?: number;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  slaDueAt: string;
  resolvedAt?: string;
  resolutionSummary?: string;
  activities: BackendActivityDto[];
  attachments: BackendAttachmentDto[];
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function normalizeStatus(raw: string): TicketStatus {
  const s = String(raw || "").toLowerCase().trim();
  if (s === "inprogress" || s === "in_progress") return "in_progress";
  if (s === "onhold" || s === "on_hold") return "on_hold";
  if (s === "resolved") return "resolved";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  return "pending";
}

export function mapBackendTicketToFrontend(dto: BackendTicketDto): Ticket {
  const priorityLower = (dto.priority || "medium").toLowerCase() as Priority;
  const statusLower = normalizeStatus(dto.status);

  return {
    id: String(dto.id),
    sequence: dto.sequence,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    subcategory: dto.subcategory || "",
    priority: priorityLower,
    status: statusLower,
    requestorId: String(dto.requesterId),
    assigneeId: dto.assigneeId ? String(dto.assigneeId) : undefined,
    siteId: String(dto.locationId),
    area: dto.locationAreaName || "General",
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    slaDueAt: dto.slaDueAt,
    resolution: dto.resolutionSummary,
    attachments: (dto.attachments || []).map((a) => ({
      id: String(a.id),
      name: a.fileName,
      size: a.fileSize,
      mimeType: a.mimeType,
      uploadedAt: a.uploadedAt,
      uploadedById: String(a.uploadedById),
      fileUrl: a.fileUrl,
    })),
    activities: (dto.activities || []).map((act) => ({
      id: String(act.id),
      type: (act.activityType.toLowerCase() as ActivityType) || "note",
      authorId: String(act.authorId),
      createdAt: act.createdAt,
      message: act.message,
      public: act.isPublic,
    })),
  };
}

export async function fetchTickets(params?: {
  status?: string;
  priority?: string;
  locationId?: number;
  assigneeId?: number;
  requesterId?: number;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<Ticket[]> {
  const queryParams: Record<string, any> = {
    pageNumber: params?.pageNumber ?? 1,
    pageSize: params?.pageSize ?? 50,
  };

  if (params?.search) queryParams.search = params.search;
  if (params?.locationId) queryParams.locationId = params.locationId;
  if (params?.assigneeId) queryParams.assigneeId = params.assigneeId;
  if (params?.requesterId) queryParams.requesterId = params.requesterId;

  // Convert status to backend enum value if present
  if (params?.status && params.status !== "all") {
    const statusMap: Record<string, number> = {
      pending: 1,
      in_progress: 2,
      on_hold: 3,
      resolved: 4,
      cancelled: 5,
    };
    if (statusMap[params.status]) {
      queryParams.status = statusMap[params.status];
    }
  }

  // Convert priority to backend enum value if present
  if (params?.priority && params.priority !== "all") {
    const priorityMap: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    if (priorityMap[params.priority]) {
      queryParams.priority = priorityMap[params.priority];
    }
  }

  const result = await api.get<PagedResult<BackendTicketSummaryDto>>("/tickets", queryParams);
  
  // Transform summary items to tickets
  return (result?.items || []).map((item) => ({
    id: String(item.id),
    sequence: item.sequence,
    title: item.title,
    description: "",
    category: item.category,
    subcategory: "",
    priority: (item.priority.toLowerCase() as Priority) || "medium",
    status: normalizeStatus(item.status),
    requestorId: item.requesterId ? String(item.requesterId) : "1",
    assigneeId: item.assigneeId ? String(item.assigneeId) : undefined,
    siteId: item.locationId ? String(item.locationId) : "1",
    area: item.locationName,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
    slaDueAt: item.slaDueAt,
    attachments: [],
    activities: [],
  }));
}

export async function getTicketById(id: string | number): Promise<Ticket> {
  const dto = await api.get<BackendTicketDto>(`/tickets/${id}`);
  return mapBackendTicketToFrontend(dto);
}

export async function createTicket(draft: TicketDraft): Promise<Ticket> {
  const priorityMap: Record<Priority, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  const payload = {
    title: draft.title,
    description: draft.description,
    category: draft.category,
    subcategory: draft.subcategory,
    priority: priorityMap[draft.priority] ?? 2,
    locationId: parseInt(draft.siteId, 10) || 1,
    locationAreaId: draft.area ? 1 : undefined,
  };

  const created = await api.post<BackendTicketDto>("/tickets", payload);
  return mapBackendTicketToFrontend(created);
}

export async function updateTicketStatus(
  ticketId: string | number,
  status: TicketStatus,
  resolutionSummary?: string,
  note?: string,
  notifyRequesterByEmail = false,
): Promise<Ticket> {
  const statusMap: Record<TicketStatus, number> = {
    pending: 1,
    in_progress: 2,
    on_hold: 3,
    resolved: 4,
    cancelled: 5,
  };

  const payload = {
    newStatus: statusMap[status] ?? 1,
    resolutionSummary,
    note,
    notifyRequesterByEmail,
  };

  const updated = await api.patch<BackendTicketDto>(`/tickets/${ticketId}/status`, payload);
  return mapBackendTicketToFrontend(updated);
}

export async function assignTicket(
  ticketId: string | number,
  assigneeId?: string | number | null,
): Promise<Ticket> {
  const payload = {
    assigneeId: assigneeId ? parseInt(String(assigneeId), 10) : null,
  };

  const updated = await api.patch<BackendTicketDto>(`/tickets/${ticketId}/assign`, payload);
  return mapBackendTicketToFrontend(updated);
}

export async function addTicketNote(
  ticketId: string | number,
  message: string,
  isPublic = false,
  notifyRequesterByEmail = false,
): Promise<TicketActivity> {
  const payload = {
    activityType: 4, // Note
    message,
    isPublic,
    notifyRequesterByEmail,
  };

  const act = await api.post<BackendActivityDto>(`/tickets/${ticketId}/activities`, payload);
  return {
    id: String(act.id),
    type: isPublic ? "public_response" : "note",
    authorId: String(act.authorId),
    createdAt: act.createdAt,
    message: act.message,
    public: act.isPublic,
  };
}

export async function uploadTicketAttachment(
  ticketId: string | number,
  file: File,
): Promise<TicketAttachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<BackendAttachmentDto>(`/tickets/${ticketId}/attachments`, formData);
  return {
    id: String(res.id),
    name: res.fileName,
    size: res.fileSize,
    mimeType: res.mimeType,
    uploadedAt: res.uploadedAt,
    uploadedById: String(res.uploadedById),
    fileUrl: res.fileUrl,
  };
}

export async function deleteTicketAttachment(
  ticketId: string | number,
  attachmentId: string | number,
): Promise<boolean> {
  return await api.delete<boolean>(`/tickets/${ticketId}/attachments/${attachmentId}`);
}