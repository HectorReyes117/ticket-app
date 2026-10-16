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
  ipGuardExtension?: string;
  securityNotes?: string;
  estimatedStaffCapacity?: string;
  availableFloors?: string;
  custodianId?: number;
  custodianName?: string;
  isActive: boolean;
  areas: BackendLocationAreaDto[];
  activeTicketsCount: number;
}

export function mapBackendLocationToSite(dto: BackendLocationDto): Site {
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name,
    facilityType: dto.facilityType,
    address: dto.address,
    city: dto.city,
    postalCode: dto.postalCode,
    phone: dto.phone,
    ipGuardExtension: dto.ipGuardExtension,
    securityNotes: dto.securityNotes,
    estimatedStaffCapacity: dto.estimatedStaffCapacity,
    availableFloors: dto.availableFloors,
    custodianId: dto.custodianId,
    custodianName: dto.custodianName,
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
    ipGuardExtension: draft.ipGuardExtension,
    securityNotes: draft.securityNotes,
    estimatedStaffCapacity: draft.estimatedStaffCapacity,
    availableFloors: draft.availableFloors,
    custodianId: draft.custodianId,
    initialAreas: draft.areas,
  };

  const created = await api.post<BackendLocationDto>("/locations", payload);
  return mapBackendLocationToSite(created);
}

export async function updateSite(id: string | number, draft: Partial<SiteDraft & { active?: boolean }>): Promise<Site> {
  const payload: any = {
    name: draft.name,
    facilityType: draft.facilityType,
    address: draft.address,
    city: draft.city,
    postalCode: draft.postalCode,
    phone: draft.phone,
    ipGuardExtension: draft.ipGuardExtension,
    securityNotes: draft.securityNotes,
    estimatedStaffCapacity: draft.estimatedStaffCapacity,
    availableFloors: draft.availableFloors,
    custodianId: draft.custodianId,
    isActive: draft.active,
    areas: draft.areas,
  };

  const updated = await api.put<BackendLocationDto>(`/locations/${id}`, payload);
  return mapBackendLocationToSite(updated);
}