import { Clock } from "lucide-react";
import { formatSla } from "@/utils";
import { cn } from "@/utils";

interface SlaTimerProps {
  dueAt: string;
  className?: string;
}

export function SlaTimer({ dueAt, className }: SlaTimerProps) {
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