import { create } from "zustand";
import {
  listSites,
  createSite as apiCreateSite,
  updateSite as apiUpdateSite,
} from "@/features/sites/services/siteService";
import type { Site, SiteDraft } from "@/types";

interface SiteStore {
  items: Site[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  ready: boolean;
  fetchSites: (params?: {
    search?: string;
    facilityType?: string;
    activeOnly?: boolean;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<void>;
  createSite: (draft: SiteDraft) => Promise<Site>;
  updateSite: (id: string, draft: Partial<SiteDraft & { active?: boolean }>) => Promise<Site>;
}

export const useSiteStore = create<SiteStore>((set) => ({
  items: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 50,
  totalPages: 1,
  loading: false,
  ready: false,

  fetchSites: async (params) => {
    set({ loading: true });
    try {
      const res = await listSites(params);
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
      console.error("Error fetching locations/sites:", err);
      set({ loading: false });
    }
  },

  createSite: async (draft) => {
    const site = await apiCreateSite(draft);
    set((state) => ({ items: [...state.items, site] }));
    return site;
  },

  updateSite: async (id, draft) => {
    const updated = await apiUpdateSite(id, draft);
    set((state) => ({
      items: state.items.map((s) => (String(s.id) === String(id) ? updated : s)),
    }));
    return updated;
  },
}));