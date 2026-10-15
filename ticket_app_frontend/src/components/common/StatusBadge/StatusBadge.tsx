import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/utils";
import { cn } from "@/utils";
import type { TicketStatus } from "@/types";

interface StatusBadgeProps {
  status: TicketStatus | string;
  className?: string;
}

const DEFAULT_META = {
  label: "Desconocido",
  badge: "border-border bg-muted text-muted-foreground",
  dot: "bg-muted-foreground",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Normalize status if comes as InProgress, inprogress, in_progress, etc.
  const raw = String(status || "").toLowerCase().trim();
  const normalizedKey: TicketStatus =
    raw === "inprogress" || raw === "in_progress"
      ? "in_progress"
      : raw === "onhold" || raw === "on_hold"
      ? "on_hold"
      : raw === "resolved"
      ? "resolved"
      : raw === "cancelled" || raw === "canceled"
      ? "cancelled"
      : "pending";

  const meta = STATUS_META[normalizedKey] || DEFAULT_META;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border font-medium whitespace-nowrap",
        meta.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}