import { api } from "@/services/api";
import type { Site, SiteDraft } from "@/types";

export interface BackendLocationAreaDto {
  id: number;
  locationId: number;
  name: string;
  floorOrBlock?: string;
  isActive: boolean;
}

export interface BackendLocationDto {
  id: number;
  code: string;
  name: string;
  facilityType: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  custodianId?: number;
  custodianName?: string;
  isActive: boolean;
  areas: BackendLocationAreaDto[];
  activeTicketsCount: number;
}

export function mapBackendLocationToSite(dto: BackendLocationDto): Site {
  return {
    id: String(dto.id),
    name: dto.name,
    address: dto.address,
    city: dto.city,
    phone: dto.phone,
    managers: dto.custodianName ? [dto.custodianName] : ["Dirección General"],
    areas: (dto.areas || []).map((a) => a.name),
    active: dto.isActive,
  };
}

export async function listSites(): Promise<Site[]> {
  const data = await api.get<BackendLocationDto[]>("/locations");
  return (data || []).map(mapBackendLocationToSite);
}

export async function createSite(draft: SiteDraft): Promise<Site> {
  const payload = {
    code: `LOC-${Math.floor(100 + Math.random() * 900)}`,
    name: draft.name,
    facilityType: "Campus",
    address: draft.address,
    city: draft.city,
    phone: draft.phone,
    areas: draft.areas.map((areaName) => ({
      name: areaName,
      floorOrBlock: "Nivel 1",
    })),
  };

  const created = await api.post<BackendLocationDto>("/locations", payload);
  return mapBackendLocationToSite(created);
}