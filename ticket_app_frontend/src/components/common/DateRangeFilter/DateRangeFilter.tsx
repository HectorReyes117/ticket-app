import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDate } from "@/utils";
import type { DateRange } from "react-day-picker";

interface DateRangeFilterProps {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  className?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const hasRange = Boolean(value?.from);
  const label =
    value?.from && value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : value?.from
        ? `Desde ${formatDate(value.from)}`
        : "Rango de fechas";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "justify-start gap-2 font-normal",
                !hasRange && "text-muted-foreground",
              )}
              aria-label="Filtrar por rango de fechas"
            />
          }
        >
          <CalendarDays className="size-4" />
          <span className="tabular-nums">{label}</span>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            numberOfMonths={2}
            autoFocus
            selected={value}
            onSelect={(range) => {
              onChange(range);
              if (range?.from && range.to) setOpen(false);
            }}
            defaultMonth={value?.from}
          />
          <div className="flex items-center justify-between gap-2 border-t border-border p-2">
            <span className="px-1 text-xs text-muted-foreground">
              Selecciona el día inicial y el final.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              disabled={!hasRange}
            >
              Limpiar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {hasRange ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Quitar el rango de fechas"
          title="Quitar el rango de fechas"
          onClick={() => onChange(undefined)}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
