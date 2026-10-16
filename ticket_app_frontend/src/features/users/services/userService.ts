import { api } from "@/services/api";
import type { User, UserDraft, Role, Presence } from "@/types";

export interface BackendUserDto {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  role: string;
  roleDescription: string;
  position: string;
  phone: string;
  extension?: string;
  avatarUrl?: string;
  presence: string;
  locationId?: number;
  locationName?: string;
  departmentId?: number;
  departmentName?: string;
  openTicketsCount: number;
  isActive: boolean;
  createdAt: string;
}

export function mapBackendDtoToUser(dto: BackendUserDto): User {
  const roleLower = (dto.role || "requestor").toLowerCase();
  const validRole: Role =
    roleLower === "admin"
      ? "admin"
      : roleLower === "technician"
      ? "technician"
      : roleLower === "director"
      ? "director"
      : "requestor";

  const presenceLower = (dto.presence || "online").toLowerCase();
  const validPresence: Presence =
    presenceLower === "busy"
      ? "busy"
      : presenceLower === "offline"
      ? "offline"
      : "online";

  return {
    id: String(dto.id),
    name: dto.name,
    email: dto.email,
    phone: dto.phone || "",
    role: validRole,
    siteId: dto.locationId ? String(dto.locationId) : "1",
    active: dto.isActive,
    presence: validPresence,
    color: "#2563eb",
    openTickets: dto.openTicketsCount || 0,
    lastActiveAt: dto.createdAt || new Date().toISOString(),
    department: dto.departmentName || "TI & Infraestructura",
    title: dto.position || "Especialista de Soporte",
    extension: dto.extension ? `Ext. ${dto.extension}` : "",
    employeeCode: dto.employeeCode || `#EMP-${dto.id}`,
    queues: ["Soporte General"],
  };
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

export async function listUsers(params?: {
  search?: string;
  role?: string;
  presence?: string;
  locationId?: number;
  activeOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: User[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }> {
  const data = await api.get<PagedResult<BackendUserDto> | BackendUserDto[]>("/users", params);
  
  if (data && "items" in data && Array.isArray(data.items)) {
    return {
      items: data.items.map(mapBackendDtoToUser),
      totalCount: data.totalCount,
      pageNumber: data.pageNumber,
      pageSize: data.pageSize,
      totalPages: data.totalPages,
    };
  }

  const list = Array.isArray(data) ? data : [];
  return {
    items: list.map(mapBackendDtoToUser),
    totalCount: list.length,
    pageNumber: 1,
    pageSize: list.length || 10,
    totalPages: 1,
  };
}

export async function getUserById(id: string | number): Promise<User> {
  const data = await api.get<BackendUserDto>(`/users/${id}`);
  return mapBackendDtoToUser(data);
}

export async function createUser(draft: UserDraft): Promise<User> {
  // Map role to backend enum number (Requestor=1, Technician=2, Admin=3, Director=4)
  const roleMap: Record<Role, number> = {
    requestor: 1,
    technician: 2,
    admin: 3,
    director: 4,
  };

  const payload = {
    name: draft.name,
    email: draft.email,
    password: "Password123!", // Default initial temporary password
    role: roleMap[draft.role] ?? 1,
    position: draft.title || "Colaborador",
    phone: draft.phone,
    extension: draft.extension,
    locationId: draft.siteId ? parseInt(draft.siteId, 10) : 1,
    departmentId: 1, // Default general department
  };

  const created = await api.post<BackendUserDto>("/users", payload);
  return mapBackendDtoToUser(created);
}

export async function updateUser(id: string | number, draft: Partial<UserDraft & { active?: boolean }>): Promise<User> {
  const roleMap: Record<Role, number> = {
    requestor: 1,
    technician: 2,
    admin: 3,
    director: 4,
  };

  const payload: any = {
    name: draft.name,
    email: draft.email,
    position: draft.title,
    phone: draft.phone,
    extension: draft.extension,
    locationId: draft.siteId ? parseInt(draft.siteId, 10) : undefined,
    isActive: draft.active,
  };

  if (draft.role) {
    payload.role = roleMap[draft.role];
  }

  const updated = await api.put<BackendUserDto>(`/users/${id}`, payload);
  return mapBackendDtoToUser(updated);
}

export async function toggleUserActive(id: string | number, isActive?: boolean): Promise<boolean> {
  const res = await api.patch<boolean>(`/users/${id}/status`, { isActive });
  return res;
}

export async function getTechnicians(): Promise<User[]> {
  const data = await api.get<PagedResult<BackendUserDto> | BackendUserDto[]>("/users/technicians", { pageSize: 100 });
  if (data && "items" in data && Array.isArray(data.items)) {
    return data.items.map(mapBackendDtoToUser);
  }
  const list = Array.isArray(data) ? data : [];
  return list.map(mapBackendDtoToUser);
}