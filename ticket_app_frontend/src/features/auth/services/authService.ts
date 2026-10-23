import { api, setStoredToken, removeStoredToken } from "@/services/api";
import type { User, Role, Presence } from "@/types";

export interface Credentials {
  email: string;
  password: string;
}

export interface BackendUserProfile {
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
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: BackendUserProfile;
}

export function mapBackendUserToFrontend(dto: BackendUserProfile): User {
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
    openTickets: 0,
    lastActiveAt: new Date().toISOString(),
    department: dto.departmentName || "TI & Infraestructura",
    title: dto.position || "Colaborador",
    extension: dto.extension ? `Ext. ${dto.extension}` : "",
    employeeCode: dto.employeeCode || `#EMP-${dto.id}`,
    avatarUrl: dto.avatarUrl,
    queues: ["Soporte General"],
  };
}

export async function login(credentials: Credentials): Promise<User> {
  const response = await api.post<AuthResponse>("/auth/login", {
    email: credentials.email.trim(),
    password: credentials.password,
  });

  if (!response || !response.token) {
    throw new Error("No se recibió el token de autenticación del servidor.");
  }

  setStoredToken(response.token);
  return mapBackendUserToFrontend(response.user);
}

export async function getCurrentUser(): Promise<User> {
  const profile = await api.get<BackendUserProfile>("/auth/me");
  return mapBackendUserToFrontend(profile);
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return await api.post<{ success: boolean; message: string }>("/auth/forgot-password", {
    email: email.trim(),
  });
}

export async function validateResetToken(token: string): Promise<boolean> {
  return await api.get<boolean>(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
}

export async function resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
  return await api.post<{ success: boolean; message: string }>("/auth/reset-password", {
    token,
    newPassword,
    confirmPassword,
  });
}

export function logout(): void {
  removeStoredToken();
}