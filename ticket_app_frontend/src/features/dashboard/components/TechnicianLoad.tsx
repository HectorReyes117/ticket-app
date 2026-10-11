import { UserAvatar } from "@/components/common/UserAvatar";
import { cn } from "@/utils";
import type { User } from "@/types";

interface TechnicianLoadProps {
  technicians: User[];
}

export function TechnicianLoad({ technicians }: TechnicianLoadProps) {
  const maxOpen = Math.max(1, ...technicians.map((t) => t.openTickets));

  return (
    <ul className="space-y-4">
      {technicians.map((tech) => {
        const pct = Math.round((tech.openTickets / maxOpen) * 100);
        return (
          <li key={tech.id}>
            <div className="flex items-center gap-3">
              <UserAvatar
                name={tech.name}
                color={tech.color}
                presence={tech.presence}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {tech.name}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {tech.openTickets}
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      en curso
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      tech.presence === "offline"
                        ? "bg-priority-medium"
                        : "bg-brand",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}