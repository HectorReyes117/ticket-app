import { mockApi } from "@/services/api";
import { mockSites } from "../data/mockSites";
import type { Site, SiteDraft } from "@/types";

const randomId = () =>
  `site-${Math.random().toString(36).slice(2, 10)}`;

export function createSiteFromDraft(draft: SiteDraft): Site {
  return {
    id: randomId(),
    name: draft.name.trim(),
    address: draft.address.trim(),
    city: draft.city.trim(),
    phone: draft.phone.trim(),
    managers: [],
    areas: draft.areas.filter((a) => a.trim().length > 0),
    active: true,
  };
}

export function listMockSites(): Promise<Site[]> {
  return mockApi(mockSites);
}