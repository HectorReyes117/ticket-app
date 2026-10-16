import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  FolderKanban,
  Inbox,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { DateRangeFilter } from "@/components/common/DateRangeFilter/DateRangeFilter";
import { KpiSection, type KpiItem } from "@/features/dashboard/components/KpiSection";
import { TicketsBrowser } from "@/features/tickets/components/TicketsBrowser";
import { TicketsDistributionChart } from "@/features/tickets/components/TicketsDistributionChart";
import { summarizeTickets } from "@/features/tickets/services/ticketQuery";
import { useTicketStore } from "@/store";
import type { DateRange } from "react-day-picker";

export function TicketsPage() {
  const tickets = useTicketStore((state) => state.items);
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const stats = useMemo(() => summarizeTickets(tickets), [tickets]);

  const kpis: KpiItem[] = [
    {
      id: "open",
      label: "Tickets Abiertos",
      value: stats.open,
      icon: <Inbox className="size-5" />,
      tone: "primary",
      trend: "Pendientes, en proceso o en espera",
    },
    {
      id: "new",
      label: "Nuevos Tickets",
      value: stats.createdLast24h,
      icon: <Sparkles className="size-5" />,
      tone: "default",
      trend: "Creadas en las últimas 24 h",
    },
    {
      id: "in-progress",
      label: "En Proceso",
      value: stats.inProgress,
      icon: <FolderKanban className="size-5" />,
      tone: "danger",
      trend: "Atendiéndose en este momento",
    },
    {
      id: "resolved",
      label: "Resueltas",
      value: stats.resolved,
      icon: <CheckCircle2 className="size-5" />,
      tone: "success",
      trend: "Cerradas con solución",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Todas las Solicitudes"
        description="Supervisión y control global de tickets de servicio en tiempo real."
        actions={
          <>
            <DateRangeFilter value={range} onChange={setRange} />
            <Button
              type="button"
              className="gap-1.5"
              onClick={() => navigate("/tickets/new")}
            >
              <Plus className="size-4" />
              Nueva Solicitud
            </Button>
          </>
        }
      />

      <KpiSection items={kpis} />

      <TicketsBrowser
        tickets={tickets}
        showQuickFilters
        createdRange={range}
        onDateRangeChange={setRange}
      />

      <TicketsDistributionChart tickets={tickets} />
    </div>
  );
}
