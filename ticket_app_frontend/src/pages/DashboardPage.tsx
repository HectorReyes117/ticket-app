import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FilePlus2,
  FolderKanban,
  Inbox,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuth } from "@/context/auth-context";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import {
  KpiSection,
  type KpiItem,
} from "@/features/dashboard/components/KpiSection";
import { TicketsByStatusChart } from "@/features/dashboard/components/TicketsByStatusChart";
import { TicketsTrendChart } from "@/features/dashboard/components/TicketsTrendChart";
import { RecentTickets } from "@/features/dashboard/components/RecentTickets";
import { TechnicianLoad } from "@/features/dashboard/components/TechnicianLoad";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export function DashboardPage() {
  const { user } = useAuth();
  const allTickets = useTicketStore((state) => state.items);
  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);

  const isRequestor = user?.role === "requestor";
  const tickets = useMemo(() => {
    if (isRequestor && user?.id) {
      return allTickets.filter((t) => t.requestorId === user.id);
    }
    return allTickets;
  }, [allTickets, isRequestor, user?.id]);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );
  const sitesById = useMemo(
    () => Object.fromEntries(sites.map((s) => [s.id, s])),
    [sites],
  );

  const technicians = useMemo(
    () => users.filter((u) => u.role === "technician" && u.active),
    [users],
  );

  const stats = useMemo(() => {
    const open = tickets.filter(
      (t) => t.status !== "resolved" && t.status !== "cancelled",
    );
    const pending = tickets.filter((t) => t.status === "pending");
    const resolved = tickets.filter((t) => t.status === "resolved");
    const slaAtRisk = open.filter(
      // eslint-disable-next-line react-hooks/purity -- comparing due dates against the current time
      (t) => new Date(t.slaDueAt).getTime() - Date.now() < 3_600_000,
    );
    return {
      total: tickets.length,
      open: open.length,
      pending: pending.length,
      resolved: resolved.length,
      slaAtRisk: slaAtRisk.length,
    };
  }, [tickets]);

  const byStatus = useMemo(
    () =>
      (["pending", "in_progress", "on_hold", "resolved", "cancelled"] as const).map(
        (status) => ({
          status,
          count: tickets.filter((t) => t.status === status).length,
        }),
      ),
    [tickets],
  );

  const trend = useMemo(() => {
    const days = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (days - 1 - index));
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      return {
        label: WEEKDAYS[day.getDay()],
        created: tickets.filter((t) => {
          const created = new Date(t.createdAt);
          return created >= day && created < next;
        }).length,
        resolved: tickets.filter((t) => {
          const updated = new Date(t.updatedAt);
          return t.status === "resolved" && updated >= day && updated < next;
        }).length,
      };
    });
  }, [tickets]);

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [tickets],
  );

  const kpis: KpiItem[] = [
    {
      id: "total",
      label: "Solicitudes registradas",
      value: stats.total,
      icon: <Inbox className="size-5" />,
      tone: "primary",
      trend: `${stats.open} activas en este momento`,
    },
    {
      id: "pending",
      label: "Pendientes de atención",
      value: stats.pending,
      icon: <FolderKanban className="size-5" />,
      tone: "danger",
      trend: "Requieren asignación",
    },
    {
      id: "resolved",
      label: "Resueltas",
      value: stats.resolved,
      icon: <CheckCircle2 className="size-5" />,
      tone: "success",
      trend: "Cerradas con solución",
    },
    {
      id: "sla",
      label: "SLA en riesgo",
      value: stats.slaAtRisk,
      icon: <AlertTriangle className="size-5" />,
      tone: stats.slaAtRisk > 0 ? "danger" : "default",
      trend:
        stats.slaAtRisk > 0
          ? "Menos de 1 hora para vencer"
          : "Sin vencimientos próximos",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen general de las solicitudes de servicio."
      />

      <KpiSection items={kpis} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-2 bg-card rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Solicitudes por Estado</h2>
            <span className="text-xs text-muted-foreground">Distribución actual</span>
          </div>
          <div className="p-5 flex-1">
            <TicketsByStatusChart data={byStatus} />
          </div>
        </div>

        <div className="xl:col-span-3 bg-card rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Actividad de los Últimos 7 Días</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-brand" />
                Creadas
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-emerald-500" />
                Resueltas
              </span>
            </div>
          </div>
          <div className="p-5 flex-1">
            <TicketsTrendChart data={trend} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 bg-card rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Solicitudes Recientes</h2>
            <span className="text-xs text-muted-foreground font-medium">Últimas 5 ingresadas</span>
          </div>
          <div className="p-5 flex-1">
            {recentTickets.length > 0 ? (
              <RecentTickets
                tickets={recentTickets}
                usersById={usersById}
                sitesById={sitesById}
              />
            ) : (
              <EmptyState
                icon={<FilePlus2 className="size-6" />}
                title="Sin solicitudes"
                description="Crea tu primera solicitud de servicio."
              />
            )}
          </div>
        </div>

        <div className="xl:col-span-2 bg-card rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Carga del Equipo Técnico</h2>
            <span className="text-xs text-muted-foreground font-medium">Asignaciones en curso</span>
          </div>
          <div className="p-5 flex-1">
            <TechnicianLoad technicians={technicians} />
          </div>
        </div>
      </div>
    </div>
  );
}