import { cn } from "@/utils";

export interface FilterPill {
  value: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterPill[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function FilterPills({
  options,
  value,
  onValueChange,
  className,
  ariaLabel,
}: FilterPillsProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors",
              active
                ? "bg-brand-soft text-brand-soft-fg"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              "ring-1 ring-border disabled:pointer-events-none",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}