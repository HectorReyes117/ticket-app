import { create } from "zustand";
import {
  fetchTickets,
  getTicketById,
  createTicket as apiCreateTicket,
  updateTicketStatus as apiUpdateTicketStatus,
  assignTicket as apiAssignTicket,
  addTicketNote as apiAddTicketNote,
} from "@/features/tickets/services/ticketService";
import type { Ticket, TicketDraft, TicketStatus } from "@/types";

interface TicketStore {
  items: Ticket[];
  loading: boolean;
  ready: boolean;
  fetchTickets: (params?: {
    status?: string;
    priority?: string;
    locationId?: number;
    assigneeId?: number;
    search?: string;
  }) => Promise<void>;
  createTicket: (draft: TicketDraft) => Promise<Ticket>;
  updateStatus: (
    id: string,
    status: TicketStatus,
    actorId?: string,
    message?: string,
  ) => Promise<void>;
  assignTicket: (id: string, assigneeId?: string | null, actorId?: string) => Promise<void>;
  addNote: (
    id: string,
    authorId: string,
    message: string,
    isPublic?: boolean,
  ) => Promise<void>;
  getTicket: (id: string) => Ticket | undefined;
  fetchTicketDetails: (id: string) => Promise<Ticket>;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  items: [],
  loading: false,
  ready: false,

  fetchTickets: async (params) => {
    set({ loading: true });
    try {
      const tickets = await fetchTickets(params);
      set((state) => {
        // Build a map of existing detailed tickets in state to preserve activities/attachments/details
        const existingMap = new Map(state.items.map((t) => [t.id, t]));
        const merged = tickets.map((incoming) => {
          const existing = existingMap.get(incoming.id);
          // If we already loaded full details (has description or attachments or activities)
          if (existing && (existing.description || existing.attachments.length > 0 || existing.activities.length > 0)) {
            return {
              ...incoming,
              description: existing.description || incoming.description,
              subcategory: existing.subcategory || incoming.subcategory,
              resolution: existing.resolution ?? incoming.resolution,
              attachments: existing.attachments,
              activities: existing.activities,
            };
          }
          return incoming;
        });

        // Also keep any tickets that might be in state but not in the paged summary list
        const incomingIds = new Set(tickets.map((t) => t.id));
        const extraTickets = state.items.filter((t) => !incomingIds.has(t.id));

        return { items: [...merged, ...extraTickets], ready: true, loading: false };
      });
    } catch (err) {
      console.error("Error fetching tickets:", err);
      set({ loading: false });
    }
  },

  createTicket: async (draft) => {
    const ticket = await apiCreateTicket(draft);
    set((state) => ({ items: [ticket, ...state.items] }));
    return ticket;
  },

  updateStatus: async (id, status, _actorId, message) => {
    const updated = await apiUpdateTicketStatus(id, status, message, message);
    set((state) => ({
      items: state.items.map((t) => (t.id === id ? updated : t)),
    }));
  },

  assignTicket: async (id, assigneeId) => {
    const updated = await apiAssignTicket(id, assigneeId);
    set((state) => ({
      items: state.items.map((t) => (t.id === id ? updated : t)),
    }));
  },

  addNote: async (id, _authorId, message, isPublic = false) => {
    const note = await apiAddTicketNote(id, message, isPublic);
    set((state) => ({
      items: state.items.map((ticket) =>
        ticket.id === id
          ? { ...ticket, activities: [note, ...ticket.activities] }
          : ticket,
      ),
    }));
  },

  getTicket: (id) => get().items.find((t) => t.id === id),

  fetchTicketDetails: async (id) => {
    const ticket = await getTicketById(id);
    set((state) => ({
      items: state.items.some((t) => t.id === id)
        ? state.items.map((t) => (t.id === id ? ticket : t))
        : [ticket, ...state.items],
    }));
    return ticket;
  },
}));