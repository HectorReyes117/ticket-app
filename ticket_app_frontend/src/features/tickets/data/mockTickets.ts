import { SLA_HOURS } from "@/utils";
import type {
  Priority,
  Ticket,
  TicketActivity,
  TicketStatus,
} from "@/types";

const minsAgo = (mins: number) =>
  new Date(Date.now() - mins * 60_000).toISOString();

const slaDue = (createdMinutes: number, priority: Priority) =>
  new Date(
    Date.now() -
      createdMinutes * 60_000 +
      SLA_HOURS[priority] * 3_600_000,
  ).toISOString();

const activity = (
  partial: Omit<TicketActivity, "id" | "createdAt"> & { minutes: number },
): TicketActivity => {
  const { minutes, ...rest } = partial;
  return {
    id: `act-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: minsAgo(minutes),
    ...rest,
  };
};

interface TicketSeed {
  sequence: number;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: Priority;
  status: TicketStatus;
  requestorId: string;
  assigneeId?: string;
  siteId: string;
  area: string;
  createdMinutes: number;
  resolution?: string;
  activities: Array<
    Omit<TicketActivity, "id" | "createdAt"> & { minutes: number }
  >;
}

const build = (seed: TicketSeed): Ticket => ({
  id: `ticket-${seed.sequence}`,
  ...seed,
  createdAt: minsAgo(seed.createdMinutes),
  updatedAt: minsAgo(seed.activities[0]?.minutes ?? seed.createdMinutes),
  slaDueAt: slaDue(seed.createdMinutes, seed.priority),
  attachments: [],
  activities: seed.activities.map((item) => {
    const { minutes, ...rest } = item;
    return activity({ ...rest, minutes });
  }),
});

export const mockTickets: Ticket[] = [
  build({
    sequence: 10001,
    title: "Fallo de conexión a internet en el tercer piso",
    description:
      "Los laboratorios de informática del tercer piso quedaron sin acceso a internet desde las 9:00 a.m. Afecta a los estudiantes de la asignatura de programación.",
    category: "Redes y Conectividad",
    subcategory: "Sin acceso a internet",
    priority: "high",
    status: "in_progress",
    requestorId: "user-pedro",
    assigneeId: "user-carlos",
    siteId: "site-central",
    area: "Laboratorios de Informática",
    createdMinutes: 240,
    activities: [
      {
        type: "created",
        minutes: 240,
        authorId: "user-pedro",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "assignment",
        minutes: 225,
        authorId: "user-admin",
        message: "Asignado a Carlos Pérez.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 215,
        authorId: "user-carlos",
        message: "Estado cambiado a En Proceso.",
        public: true,
      },
      {
        type: "note",
        minutes: 90,
        authorId: "user-carlos",
        message:
          "Detecté el switch del piso 3 con errores de CRC. Estoy revisando el cableado del rack.",
        public: false,
      },
    ],
  }),
  build({
    sequence: 10002,
    title: "Impresora del registro no imprime",
    description:
      "La impresora multifuncional del departamento de Registro muestra error de atasco de papel que no existe y no imprime doble cara.",
    category: "Impresión y Digitalización",
    subcategory: "Impresora",
    priority: "medium",
    status: "pending",
    requestorId: "user-pedro",
    siteId: "site-central",
    area: "Registro",
    createdMinutes: 150,
    activities: [
      {
        type: "created",
        minutes: 150,
        authorId: "user-pedro",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10003,
    title: "Error al abrir el sistema de pagos",
    description:
      "Al iniciar sesión en el módulo de pagos aparece el error FS-503 y los estudiantes no pueden pagar sus recargos.",
    category: "Aplicaciones y Software",
    subcategory: "Error de aplicación",
    priority: "critical",
    status: "in_progress",
    requestorId: "user-valentina",
    assigneeId: "user-javier",
    siteId: "site-romana",
    area: "Administración",
    createdMinutes: 55,
    activities: [
      {
        type: "created",
        minutes: 55,
        authorId: "user-valentina",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "escalation",
        minutes: 38,
        authorId: "user-admin",
        message:
          "SLA en riesgo: la solicitud supera la ventana de respuesta para prioridad Crítica.",
        public: true,
      },
      {
        type: "assignment",
        minutes: 30,
        authorId: "user-admin",
        message: "Asignado a Javier Fernández.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 25,
        authorId: "user-javier",
        message: "Estado cambiado a En Proceso.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10004,
    title: "Configuración de laptop nueva para docencia",
    description:
      "Necesito configuración y unión al dominio para la laptop asignada a la profesora de contabilidad.",
    category: "Soporte de Escritorio",
    subcategory: "Configuración de equipo",
    priority: "medium",
    status: "resolved",
    requestorId: "user-diego",
    assigneeId: "user-javier",
    siteId: "site-este",
    area: "Aulas",
    createdMinutes: 2880,
    resolution:
      "Equipo configurado, unido al dominio y con el software institucional instalado.",
    activities: [
      {
        type: "created",
        minutes: 2880,
        authorId: "user-diego",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "assignment",
        minutes: 2840,
        authorId: "user-admin",
        message: "Asignado a Javier Fernández.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 1540,
        authorId: "user-javier",
        message: "Estado cambiado a Resuelto.",
        public: true,
      },
      {
        type: "public_response",
        minutes: 1540,
        authorId: "user-javier",
        message: "Equipo listo. Puedes retirarlo en Soporte Técnico.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10005,
    title: "Proyector de la sala 2B muestra colores distorsionados",
    description:
      "El proyector de la sala 2B tiende a verde; ya validamos cables y el problema persiste.",
    category: "Infraestructura",
    subcategory: "Proyectores",
    priority: "low",
    status: "on_hold",
    requestorId: "user-lucia",
    assigneeId: "user-luis",
    siteId: "site-santiago",
    area: "Aulas",
    createdMinutes: 1320,
    activities: [
      {
        type: "created",
        minutes: 1320,
        authorId: "user-lucia",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "assignment",
        minutes: 1250,
        authorId: "user-luis",
        message: "Asignado a Luis Martínez.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 960,
        authorId: "user-luis",
        message:
          "Estado cambiado a En Espera. Se solicita cotización al proveedor.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10006,
    title: "Instalación de Office en laboratorio 3",
    description:
      "Instalar la suite completa en las 20 máquinas del laboratorio 3 antes de la próxima semana.",
    category: "Aplicaciones y Software",
    subcategory: "Instalación",
    priority: "medium",
    status: "in_progress",
    requestorId: "user-pedro",
    assigneeId: "user-carlos",
    siteId: "site-central",
    area: "Laboratorios de Informática",
    createdMinutes: 420,
    activities: [
      {
        type: "created",
        minutes: 420,
        authorId: "user-pedro",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "assignment",
        minutes: 400,
        authorId: "user-admin",
        message: "Asignado a Carlos Pérez.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 380,
        authorId: "user-carlos",
        message: "Estado cambiado a En Proceso.",
        public: true,
      },
      {
        type: "public_response",
        minutes: 200,
        authorId: "user-carlos",
        message:
          "Voy por la máquina 12 de 20. Estimo terminar hoy a las 4:00 p.m.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10007,
    title: "Correo bloqueado por alerta de phishing",
    description:
      "Un miembro del departamento de Admisiones reporta que su cuenta fue bloqueada por respuesta a un correo sospechoso.",
    category: "Seguridad y Accesos",
    subcategory: "Credenciales",
    priority: "high",
    status: "in_progress",
    requestorId: "user-valentina",
    assigneeId: "user-sofia",
    siteId: "site-central",
    area: "Administración",
    createdMinutes: 200,
    activities: [
      {
        type: "created",
        minutes: 200,
        authorId: "user-valentina",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "assignment",
        minutes: 180,
        authorId: "user-admin",
        message: "Asignado a Sofía Gómez.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 170,
        authorId: "user-sofia",
        message: "Estado cambiado a En Proceso.",
        public: true,
      },
      {
        type: "note",
        minutes: 60,
        authorId: "user-sofia",
        message:
          "La cuenta fue auditada por el SIEM: se descartó compromiso de datos. Restablezco en el próximo ciclo.",
        public: false,
      },
    ],
  }),
  build({
    sequence: 10008,
    title: "Tarjeta de acceso de biblioteca no funciona",
    description:
      "La tarjeta del personal de la biblioteca no abre la puerta trasera desde el viernes.",
    category: "Seguridad y Accesos",
    subcategory: "Tarjeta de acceso",
    priority: "low",
    status: "pending",
    requestorId: "user-lucia",
    siteId: "site-santiago",
    area: "Biblioteca",
    createdMinutes: 90,
    activities: [
      {
        type: "created",
        minutes: 90,
        authorId: "user-lucia",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10009,
    title: "Red WiFi débil en el auditorio",
    description:
      "Durante el evento del lunes la conexión WiFi en el auditorio fue inestable. Solicito revisión de los puntos de acceso.",
    category: "Redes y Conectividad",
    subcategory: "Red inalámbrica",
    priority: "medium",
    status: "on_hold",
    requestorId: "user-carlos",
    assigneeId: "user-luis",
    siteId: "site-central",
    area: "Auditorio",
    createdMinutes: 1700,
    activities: [
      {
        type: "created",
        minutes: 1700,
        authorId: "user-carlos",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 1450,
        authorId: "user-luis",
        message:
          "Estado cambiado a En Espera: el reemplazo del AP se encargará al proveedor del contrato.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10010,
    title: "Licencia de antivirus vencida",
    description:
      "El agente de seguridad reporta que la licencia vence en 7 días en el parque de dispositivos.",
    category: "Aplicaciones y Software",
    subcategory: "Licenciamiento",
    priority: "high",
    status: "in_progress",
    requestorId: "user-diego",
    assigneeId: "user-javier",
    siteId: "site-este",
    area: "Administración",
    createdMinutes: 340,
    activities: [
      {
        type: "created",
        minutes: 340,
        authorId: "user-diego",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "assignment",
        minutes: 320,
        authorId: "user-admin",
        message: "Asignado a Javier Fernández.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 310,
        authorId: "user-javier",
        message: "Estado cambiado a En Proceso.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10011,
    title: "Reemplazo de teclado del aula 5A",
    description:
      "Solicito reemplazo del teclado de la PC docente del aula 5A.",
    category: "Soporte de Escritorio",
    subcategory: "Periféricos",
    priority: "low",
    status: "cancelled",
    requestorId: "user-diego",
    siteId: "site-este",
    area: "Aulas",
    createdMinutes: 2600,
    activities: [
      {
        type: "created",
        minutes: 2600,
        authorId: "user-diego",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 2400,
        authorId: "user-diego",
        message:
          "Estado cambiado a Cancelado: se resolvió de forma interna con un equipo rescatado.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10012,
    title: "Solicitud de VPN para profesor visitante",
    description:
      "Un profesor visitante necesita acceso VPN temporal de 30 días para la investigación del cuatrimestre.",
    category: "Correo y Colaboración",
    subcategory: "Acceso VPN",
    priority: "medium",
    status: "resolved",
    requestorId: "user-lucia",
    assigneeId: "user-luis",
    siteId: "site-santiago",
    area: "Administración",
    createdMinutes: 4320,
    resolution:
      "Se generó el perfil VPN con vencimiento configurado en 30 días y se enviaron las credenciales por correo cifrado.",
    activities: [
      {
        type: "created",
        minutes: 4320,
        authorId: "user-lucia",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 4100,
        authorId: "user-luis",
        message: "Estado cambiado a Resuelto.",
        public: true,
      },
    ],
  }),
  build({
    sequence: 10013,
    title: "Caída de servidor de archivos en Sede Este",
    description:
      "El servidor de archivos compartidos no responde. Afecta a todo el campus de Santo Domingo Este.",
    category: "Infraestructura",
    subcategory: "Energía",
    priority: "critical",
    status: "in_progress",
    requestorId: "user-diego",
    assigneeId: "user-javier",
    siteId: "site-este",
    area: "Administración",
    createdMinutes: 35,
    activities: [
      {
        type: "created",
        minutes: 35,
        authorId: "user-diego",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
      {
        type: "status_change",
        minutes: 28,
        authorId: "user-javier",
        message: "Estado cambiado a En Proceso.",
        public: true,
      },
      {
        type: "note",
        minutes: 12,
        authorId: "user-javier",
        message:
          "El UPS no conmutó correctamente tras el corte. Revisando el nodo de almacenamiento.",
        public: false,
      },
    ],
  }),
  build({
    sequence: 10014,
    title: "Toners para impresoras de la extensión",
    description:
      "Solicito inventario de toners para las dos multifuncionales de la extensión La Romana.",
    category: "Impresión y Digitalización",
    subcategory: "Toner",
    priority: "low",
    status: "pending",
    requestorId: "user-valentina",
    siteId: "site-romana",
    area: "Administración",
    createdMinutes: 70,
    activities: [
      {
        type: "created",
        minutes: 70,
        authorId: "user-valentina",
        message: "Solicitud creada desde el portal de servicios.",
        public: true,
      },
    ],
  }),
];