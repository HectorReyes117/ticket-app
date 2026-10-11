import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/utils";
import { cn } from "@/utils";
import type { TicketStatus } from "@/types";

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];
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