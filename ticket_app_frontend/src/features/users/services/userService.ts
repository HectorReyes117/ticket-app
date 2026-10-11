import { mockApi } from "@/services/api";
import { mockUsers } from "../data/mockUsers";
import type { User, UserDraft } from "@/types";

const randomId = () =>
  `user-${Math.random().toString(36).slice(2, 10)}`;

export function createUserFromDraft(draft: UserDraft): User {
  return {
    id: randomId(),
    name: draft.name.trim(),
    email: draft.email.trim().toLowerCase(),
    phone: draft.phone.trim(),
    role: draft.role,
    siteId: draft.siteId,
    active: true,
    presence: "offline",
    color: "#2563eb",
    openTickets: 0,
    lastActiveAt: new Date().toISOString(),
  };
}

export function findByEmail(
  email: string,
  users: User[] = mockUsers,
): User | undefined {
  return users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

export function listMockUsers(): Promise<User[]> {
  return mockApi(mockUsers);
}