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
  // The calendar edits a draft: nothing reaches the page until "Aplicar",
  // so a half-finished range never filters the table.
  const [draft, setDraft] = useState<DateRange | undefined>(value);

  const hasRange = Boolean(value?.from);
  const label =
    value?.from && value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : value?.from
        ? `Desde ${formatDate(value.from)}`
        : "Rango de fechas";

  const hint =
    draft?.from && !draft.to
      ? "Ahora elige el día final."
      : draft?.from && draft.to
        ? "Confirma con Aplicar."
        : "Elige el día inicial y el final.";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover
        open={open}
        onOpenChange={(next, details) => {
          // Base UI reports a focus shift as "focus-out" and dismisses the popover.
          // The inline calendar moves focus between day cells while a range is being
          // picked, so that reason must not close it. Outside press and Escape still do.
          if (!next && details.reason === "focus-out") return;
          setOpen(next);
          if (next) setDraft(value);
        }}
      >
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
            selected={draft}
            onSelect={setDraft}
            defaultMonth={draft?.from}
          />
          <div className="flex items-center justify-between gap-2 border-t border-border p-2">
            <span className="px-1 text-xs text-muted-foreground">{hint}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDraft(undefined)}
                disabled={!draft?.from}
              >
                Limpiar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              >
                Aplicar
              </Button>
            </div>
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
