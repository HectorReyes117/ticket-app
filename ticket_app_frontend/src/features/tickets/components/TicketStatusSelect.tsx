import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_META, cn, TICKET_STATUSES } from "@/utils";
import type { TicketStatus } from "@/types";

interface TicketStatusSelectProps {
  value: TicketStatus;
  onValueChange: (value: TicketStatus) => void;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function TicketStatusSelect({
  value,
  onValueChange,
  disabled,
  size = "default",
  className,
}: TicketStatusSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(next as TicketStatus)}
      disabled={disabled}
    >
      <SelectTrigger
        size={size}
        className={cn("gap-1.5", className)}
        aria-label="Cambiar estado"
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            STATUS_META[value].dot,
          )}
        />
        <SelectValue placeholder="Estado" />
      </SelectTrigger>
      <SelectContent>
        {TICKET_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <span
              className={cn(
                "flex items-center gap-2 font-medium",
                STATUS_META[status].dot === "" ? "" : "",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  STATUS_META[status].dot,
                )}
              />
              {STATUS_META[status].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}