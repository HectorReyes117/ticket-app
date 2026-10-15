import { create } from "zustand";
import {
  listSites,
  createSite as apiCreateSite,
} from "@/features/sites/services/siteService";
import type { Site, SiteDraft } from "@/types";

interface SiteStore {
  items: Site[];
  loading: boolean;
  ready: boolean;
  fetchSites: (params?: {
    search?: string;
    activeOnly?: boolean;
  }) => Promise<void>;
  createSite: (draft: SiteDraft) => Promise<Site>;
}

export const useSiteStore = create<SiteStore>((set) => ({
  items: [],
  loading: false,
  ready: false,

  fetchSites: async (params) => {
    set({ loading: true });
    try {
      const sites = await listSites(params);
      set({ items: sites, ready: true, loading: false });
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
}));