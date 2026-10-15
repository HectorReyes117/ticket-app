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

export function KpiCard({
  label,
  value,
  icon,
  tone = "default",
  trend,
  footer,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between group hover:shadow-md transition-shadow relative overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
        <div
          className={cn(
            "size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
            tone === "primary"
              ? "bg-brand-soft text-brand border border-brand/20"
              : tone === "danger"
              ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
              : tone === "success"
              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
              : "bg-muted text-foreground border border-border",
          )}
        >
          {icon}
        </div>
      </div>

      <div>
        <div className="text-3xl font-bold tracking-tight text-foreground mb-1 tabular-nums">
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                tone === "primary"
                  ? "bg-brand animate-pulse"
                  : tone === "danger"
                  ? "bg-red-500"
                  : tone === "success"
                  ? "bg-emerald-500"
                  : "bg-muted-foreground",
              )}
            />
            <span className="truncate">{trend}</span>
          </div>
        )}
      </div>

      {footer ? <div className="mt-3 border-t border-border pt-3">{footer}</div> : null}
    </div>
  );
}