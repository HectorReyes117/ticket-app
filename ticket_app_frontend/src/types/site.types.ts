export interface Site {
  id: string;
  code?: string;
  name: string;
  facilityType?: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  custodianId?: number;
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
  custodianId?: number;
  areas: string[];
}