import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { STATUS_META, cn, TICKET_STATUSES } from "@/utils";
import type { TicketStatus } from "@/types";

const STATUS_HEX: Record<TicketStatus, string> = {
  pending: "#64748b",
  in_progress: "#2563eb",
  on_hold: "#d97706",
  resolved: "#047857",
  cancelled: "#94a3b8",
};

interface TicketsByStatusChartProps {
  data: Array<{ status: TicketStatus; count: number }>;
  /** Caption under the centre total. Defaults to the dashboard's existing wording. */
  centerLabel?: string;
}

export function TicketsByStatusChart({
  data,
  centerLabel = "solicitudes",
}: TicketsByStatusChartProps) {
  const chartData = data.filter((item) => item.count > 0);
  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[240px] w-[240px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={2}
              cornerRadius={4}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={STATUS_HEX[entry.status]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [Number(value ?? 0), "solicitudes"]}
              labelFormatter={(_, payload) => {
                const status = payload?.[0]?.payload?.status as TicketStatus | undefined;
                return status ? STATUS_META[status].label : "";
              }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                fontSize: 12,
                boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums text-foreground">
            {total}
          </span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {TICKET_STATUSES.map((status) => {
          const count = data.find((d) => d.status === status)?.count ?? 0;
          return (
            <li key={status} className="flex items-center gap-2">
              <span
                className={cn("size-2 shrink-0 rounded-full", STATUS_META[status].dot)}
                style={{ backgroundColor: STATUS_HEX[status] }}
              />
              <span className="flex-1 text-sm text-muted-foreground">
                {STATUS_META[status].label}
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {count}
              </span>
              <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                {total > 0 ? Math.round((count / total) * 100) : 0}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}