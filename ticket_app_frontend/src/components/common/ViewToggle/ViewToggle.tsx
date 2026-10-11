import { Kanban, Table2 } from "lucide-react";
import { cn } from "@/utils";
import type { TicketView } from "@/types";

interface ViewToggleProps {
  value: TicketView;
  onValueChange: (value: TicketView) => void;
  className?: string;
}

const OPTIONS: Array<{ value: TicketView; label: string; icon: typeof Table2 }> = [
  { value: "table", label: "Tabla", icon: Table2 },
  { value: "kanban", label: "Kanban", icon: Kanban },
];

export function ViewToggle({ value, onValueChange, className }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Vista de solicitudes"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted p-1",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-card text-brand shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}