import { create } from "zustand";
import { mockUsers } from "@/features/users/data/mockUsers";
import { createUserFromDraft } from "@/features/users/services/userService";
import type { User, UserDraft } from "@/types";

interface UserStore {
  items: User[];
  ready: boolean;
  seedUsers: () => void;
  createUser: (draft: UserDraft) => User;
  toggleActive: (id: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  items: mockUsers,
  ready: true,
  seedUsers: () => set({ items: mockUsers, ready: true }),

  createUser: (draft) => {
    const user = createUserFromDraft(draft);
    set((state) => ({ items: [...state.items, user] }));
    return user;
  },

  toggleActive: (id) => {
    set((state) => ({
      items: state.items.map((user) =>
        user.id === id ? { ...user, active: !user.active } : user,
      ),
    }));
  },
}));