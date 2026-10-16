import { create } from "zustand";
import {
  listUsers,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  toggleUserActive as apiToggleUserActive,
} from "@/features/users/services/userService";
import type { User, UserDraft } from "@/types";

interface UserStore {
  items: User[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  ready: boolean;
  fetchUsers: (params?: {
    search?: string;
    role?: string;
    presence?: string;
    locationId?: number;
    activeOnly?: boolean;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;
  createUser: (draft: UserDraft) => Promise<User>;
  updateUser: (id: string, draft: Partial<UserDraft & { active?: boolean }>) => Promise<User>;
  toggleActive: (id: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  items: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  loading: false,
  ready: false,

  fetchUsers: async (params) => {
    set({ loading: true });
    try {
      const res = await listUsers(params);
      set({
        items: res.items,
        totalCount: res.totalCount,
        pageNumber: res.pageNumber,
        pageSize: res.pageSize,
        totalPages: res.totalPages,
        ready: true,
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      set({ loading: false });
    }
  },

  createUser: async (draft) => {
    const user = await apiCreateUser(draft);
    set((state) => ({ items: [...state.items, user] }));
    return user;
  },

  updateUser: async (id, draft) => {
    const updated = await apiUpdateUser(id, draft);
    set((state) => ({
      items: state.items.map((u) => (u.id === id ? updated : u)),
    }));
    return updated;
  },

  toggleActive: async (id) => {
    const target = get().items.find((u) => u.id === id);
    const newStatus = target ? !target.active : true;
    await apiToggleUserActive(id, newStatus);
    set((state) => ({
      items: state.items.map((user) =>
        user.id === id ? { ...user, active: newStatus } : user,
      ),
    }));
  },
}));