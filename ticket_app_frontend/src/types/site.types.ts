export interface Site {
  id: string;
  code?: string;
  name: string;
  facilityType?: string;
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
  managers: string[];
  areas: string[];
  active: boolean;
}

export interface SiteDraft {
  name: string;
  facilityType?: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  ipGuardExtension?: string;
  securityNotes?: string;
  estimatedStaffCapacity?: string;
  availableFloors?: string;
  custodianId?: number;
  areas: string[];
}