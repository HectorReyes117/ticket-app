import { Clock } from "lucide-react";
import { formatSla } from "@/utils";
import { cn } from "@/utils";

interface SlaTimerProps {
  dueAt: string;
  status?: string;
  className?: string;
}

export function SlaTimer({ dueAt, status, className }: SlaTimerProps) {
  if (status === "resolved") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400",
          className,
        )}
      >
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Completado
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-muted-foreground",
          className,
        )}
      >
        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        Cancelado
      </div>
    );
  }

  const sla = formatSla(dueAt);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium tabular-nums",
        sla.overdue
          ? "text-priority-critical"
          : sla.warning
            ? "text-priority-high"
            : "text-muted-foreground",
        className,
      )}
    >
      {sla.overdue ? (
        <Clock className="size-3.5" />
      ) : (
        <span
          className={cn(
            "size-1.5 rounded-full",
            sla.warning ? "bg-priority-high animate-pulse" : "bg-emerald-500",
          )}
        />
      )}
      {sla.label}
    </div>
  );
}