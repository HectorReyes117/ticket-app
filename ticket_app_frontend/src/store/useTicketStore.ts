import { create } from "zustand";
import { mockTickets } from "@/features/tickets/data/mockTickets";
import {
  applyAssignment,
  applyNote,
  applyStatusTransition,
  createTicketFromDraft,
} from "@/features/tickets/services/ticketService";
import type { Ticket, TicketDraft, TicketStatus } from "@/types";

interface TicketStore {
  items: Ticket[];
  ready: boolean;
  seedTickets: () => void;
  createTicket: (draft: TicketDraft) => Ticket;
  updateStatus: (
    id: string,
    status: TicketStatus,
    actorId: string,
    message?: string,
  ) => void;
  assignTicket: (id: string, assigneeId: string, actorId: string) => void;
  addNote: (
    id: string,
    authorId: string,
    message: string,
    isPublic?: boolean,
  ) => void;
  getTicket: (id: string) => Ticket | undefined;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  items: mockTickets,
  ready: true,
  seedTickets: () => set({ items: mockTickets, ready: true }),

  createTicket: (draft) => {
    const ticket = createTicketFromDraft(draft, get().items);
    set((state) => ({ items: [ticket, ...state.items] }));
    return ticket;
  },

  updateStatus: (id, status, actorId, message) => {
    set((state) => ({
      items: state.items.map((ticket) =>
        ticket.id === id
          ? applyStatusTransition(ticket, status, actorId, message)
          : ticket,
      ),
    }));
  },

  assignTicket: (id, assigneeId, actorId) => {
    set((state) => ({
      items: state.items.map((ticket) =>
        ticket.id === id
          ? applyAssignment(ticket, assigneeId, actorId)
          : ticket,
      ),
    }));
  },

  addNote: (id, authorId, message, isPublic = false) => {
    set((state) => ({
      items: state.items.map((ticket) =>
        ticket.id === id
          ? applyNote(ticket, authorId, message, isPublic)
          : ticket,
      ),
    }));
  },

  getTicket: (id) => get().items.find((t) => t.id === id),
}));