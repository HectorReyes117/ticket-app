import { Badge } from "@/components/ui/badge";
import { PRIORITY_META } from "@/utils";
import { cn } from "@/utils";
import type { Priority } from "@/types";

interface PriorityBadgeProps {
  priority: Priority;
  withLabel?: boolean;
  className?: string;
}

export function PriorityBadge({
  priority,
  withLabel = true,
  className,
}: PriorityBadgeProps) {
  const meta = PRIORITY_META[priority];

  if (priority === "critical") {
    return (
      <Badge
        variant="outline"
        className={cn("gap-1.5 border font-medium whitespace-nowrap", meta.badge, className)}
      >
        <span className="flex items-end gap-px">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn("w-1 rounded-[1px]", meta.bars)}
              style={{ height: `${3 + i * 2}px` }}
            />
          ))}
        </span>
        {withLabel ? meta.label : null}
      </Badge>
    );
  }

  const filled = [1, 2, 3].slice(0, meta.rank === 1 ? 1 : meta.rank);
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border font-medium whitespace-nowrap", meta.badge, className)}
    >
      <span className="flex items-end gap-px">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "w-1 rounded-[1px]",
              filled.includes(i) ? meta.bars : "bg-border",
            )}
            style={{ height: `${3 + i * 2}px` }}
          />
        ))}
      </span>
      {withLabel ? meta.label : null}
    </Badge>
  );
}