import { Card } from "@/components/ui/card";
import { cn } from "@/utils";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "default" | "danger" | "primary" | "success";
  trend?: string;
  footer?: ReactNode;
  className?: string;
}

const TONE = {
  default: { chip: "bg-secondary text-secondary-foreground", trend: "text-muted-foreground" },
  primary: { chip: "bg-brand-soft text-brand-soft-fg", trend: "text-brand-soft-fg" },
  danger: { chip: "bg-priority-critical-bg text-priority-critical", trend: "text-priority-critical" },
  success: { chip: "bg-status-resolved-bg text-status-resolved-fg", trend: "text-status-resolved-fg" },
} as const;

export function KpiCard({
  label,
  value,
  icon,
  tone = "default",
  trend,
  footer,
  className,
}: KpiCardProps) {
  const tokens = TONE[tone];
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-3xl leading-none font-semibold tabular-nums text-foreground">
            {value}
          </p>
        </div>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tokens.chip)}>
          {icon}
        </span>
      </div>
      {trend && (
        <p className={cn("mt-3 text-sm font-medium", tokens.trend)}>{trend}</p>
      )}
      {footer ? <div className="mt-4 border-t border-border pt-3">{footer}</div> : null}
    </Card>
  );
}