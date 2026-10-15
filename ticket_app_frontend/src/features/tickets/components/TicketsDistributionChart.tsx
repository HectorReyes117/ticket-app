import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketsByStatusChart } from "@/features/dashboard/components/TicketsByStatusChart";
import {
  DISTRIBUTION_PERIODS,
  DISTRIBUTION_PERIOD_LABELS,
  countByStatus,
  filterByPeriod,
  summarizeSla,
  type DistributionPeriod,
} from "../services/ticketQuery";
import type { Ticket } from "@/types";

interface TicketsDistributionChartProps {
  tickets: Ticket[];
}

export function TicketsDistributionChart({
  tickets,
}: TicketsDistributionChartProps) {
  const [period, setPeriod] = useState<DistributionPeriod>("month");

  const scoped = useMemo(
    () => filterByPeriod(tickets, period),
    [tickets, period],
  );
  const byStatus = useMemo(() => countByStatus(scoped), [scoped]);
  const sla = useMemo(() => summarizeSla(scoped), [scoped]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Distribución de Solicitudes</CardTitle>
        <Select
          value={period}
          onValueChange={(value) =>
            setPeriod((value ?? "month") as DistributionPeriod)
          }
        >
          <SelectTrigger className="w-40" aria-label="Periodo de la distribución">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {DISTRIBUTION_PERIODS.map((option) => (
              <SelectItem key={option} value={option}>
                {DISTRIBUTION_PERIOD_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-medium text-foreground">
            Resumen global
          </span>
          <span className="text-xs text-muted-foreground">
            {scoped.length} solicitudes en el periodo
          </span>
        </div>

        <TicketsByStatusChart data={byStatus} centerLabel="Tickets totales" />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Resolución conforme dentro de meta{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {sla.percentage === null ? "—" : `(${sla.percentage}%)`}
            </span>
          </p>
          <span className="text-xs text-muted-foreground">
            {sla.resolved === 0
              ? "Sin solicitudes resueltas en el periodo"
              : `${sla.compliant} de ${sla.resolved} resueltas dentro del SLA`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
