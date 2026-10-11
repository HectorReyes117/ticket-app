import { ChevronDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils";
import type { User } from "@/types";

interface AssignMenuProps {
  assignee?: User;
  technicians: User[];
  onAssign: (userId: string) => void;
}

export function AssignMenu({ assignee, technicians, onAssign }: AssignMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="h-9 gap-2" />}
      >
        {assignee ? (
          <>
            <UserAvatar name={assignee.name} color={assignee.color} size="xs" />
            {assignee.name}
          </>
        ) : (
          <>
            <UserPlus className="size-4" />
            Asignar técnico
          </>
        )}
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground">
          Asignar a
        </DropdownMenuLabel>
        {technicians.map((tech) => {
          const isCurrent = tech.id === assignee?.id;
          return (
            <DropdownMenuItem
              key={tech.id}
              disabled={isCurrent}
              onClick={() => onAssign(tech.id)}
              className="gap-2"
            >
              <UserAvatar
                name={tech.name}
                color={tech.color}
                presence={tech.presence}
                size="sm"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{tech.name}</span>
                <span
                  className={cn("block text-xs", isCurrent ? "text-muted-foreground" : "text-muted-foreground")}
                >
                  {tech.openTickets} en curso
                </span>
              </span>
              {isCurrent ? (
                <span className="text-xs font-medium text-brand">Actual</span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}