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

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export async function listSites(params?: {
  search?: string;
  facilityType?: string;
  activeOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: Site[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }> {
  const data = await api.get<PagedResult<BackendLocationDto> | BackendLocationDto[]>("/locations", params);

  if (data && "items" in data && Array.isArray(data.items)) {
    return {
      items: data.items.map(mapBackendLocationToSite),
      totalCount: data.totalCount,
      pageNumber: data.pageNumber,
      pageSize: data.pageSize,
      totalPages: data.totalPages,
    };
  }

  const list = Array.isArray(data) ? data : [];
  return {
    items: list.map(mapBackendLocationToSite),
    totalCount: list.length,
    pageNumber: 1,
    pageSize: list.length || 50,
    totalPages: 1,
  };
}

export async function createSite(draft: SiteDraft): Promise<Site> {
  const payload = {
    name: draft.name,
    facilityType: draft.facilityType || "Campus Principal",
    address: draft.address,
    city: draft.city,
    postalCode: draft.postalCode,
    phone: draft.phone,
    custodianId: draft.custodianId,
    initialAreas: draft.areas,
  };

  const created = await api.post<BackendLocationDto>("/locations", payload);
  return mapBackendLocationToSite(created);
}