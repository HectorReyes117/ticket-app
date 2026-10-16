export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
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