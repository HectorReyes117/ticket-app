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
  address: string;
  city: string;
  phone: string;
  areas: string[];
}