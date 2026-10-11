import { create } from "zustand";
import { mockSites } from "@/features/sites/data/mockSites";
import { createSiteFromDraft } from "@/features/sites/services/siteService";
import type { Site, SiteDraft } from "@/types";

interface SiteStore {
  items: Site[];
  ready: boolean;
  seedSites: () => void;
  createSite: (draft: SiteDraft) => Site;
}

export const useSiteStore = create<SiteStore>((set) => ({
  items: mockSites,
  ready: true,
  seedSites: () => set({ items: mockSites, ready: true }),

  createSite: (draft) => {
    const site = createSiteFromDraft(draft);
    set((state) => ({ items: [...state.items, site] }));
    return site;
  },
}));