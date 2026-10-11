import type { Site } from "@/types";

export const mockSites: Site[] = [
  {
    id: "site-central",
    name: "Sede Central",
    address: "Av. Máximo Gómez #72",
    city: "Santo Domingo",
    phone: "+1 809-555-0201",
    managers: ["user-admin", "user-director"],
    areas: [
      "Administración",
      "Registro",
      "Aulas",
      "Laboratorios de Informática",
      "Biblioteca",
      "Auditorio",
      "Servicios Generales",
    ],
    active: true,
  },
  {
    id: "site-santiago",
    name: "Campus Santiago",
    address: "Av. Circunvalación Sur #14",
    city: "Santiago de los Caballeros",
    phone: "+1 809-555-0202",
    managers: ["user-luis"],
    areas: [
      "Administración",
      "Aulas",
      "Laboratorios de Informática",
      "Biblioteca",
      "Servicios Generales",
    ],
    active: true,
  },
  {
    id: "site-este",
    name: "Sede Santo Domingo Este",
    address: "Aut. San Isidro Km 4",
    city: "Santo Domingo Este",
    phone: "+1 809-555-0203",
    managers: ["user-javier"],
    areas: [
      "Administración",
      "Aulas",
      "Laboratorios de Informática",
      "Comedor",
    ],
    active: true,
  },
  {
    id: "site-romana",
    name: "Extensión La Romana",
    address: "Av. Libertad #218",
    city: "La Romana",
    phone: "+1 809-555-0204",
    managers: [],
    areas: ["Administración", "Aulas", "Servicios Generales"],
    active: true,
  },
];

export const SITE_AREAS_EXAMPLE = [
  "Administración",
  "Aulas",
  "Laboratorios de Informática",
  "Biblioteca",
  "Registro",
  "Servicios Generales",
];