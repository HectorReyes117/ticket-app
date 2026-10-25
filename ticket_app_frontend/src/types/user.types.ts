export type Role = "requestor" | "technician" | "admin" | "director";

export type Presence = "online" | "busy" | "offline";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  siteId: string;
  active: boolean;
  presence: Presence;
  color: string;
  openTickets: number;
  lastActiveAt: string;
  department?: string;
  title?: string;
  extension?: string;
  employeeCode?: string;
  queues?: string[];
  avatarUrl?: string;
  mustChangePassword?: boolean;
}

export interface UserDraft {
  name: string;
  email: string;
  phone: string;
  role: Role;
  siteId: string;
  department?: string;
  title?: string;
  extension?: string;
  employeeCode?: string;
  queues?: string[];
  avatarUrl?: string;
  generatePasswordLink?: boolean;
}