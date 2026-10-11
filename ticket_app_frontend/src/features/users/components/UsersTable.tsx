import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/common/UserAvatar";
import { formatRelativeTime, ROLE_META } from "@/utils";
import { cn } from "@/utils";
import type { Site, User } from "@/types";

interface UsersTableProps {
  users: User[];
  sitesById: Record<string, Site | undefined>;
  onToggleActive: (userId: string) => void;
}

export function UsersTable({ users, sitesById, onToggleActive }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Sede</TableHead>
            <TableHead className="text-center">En curso</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Última actividad</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={user.name}
                    color={user.color}
                    presence={user.presence}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{ROLE_META[user.role].label}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {sitesById[user.siteId]?.name ?? "—"}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {user.openTickets}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-medium",
                    user.active ? "text-status-resolved" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      user.active ? "bg-emerald-500" : "bg-slate-400",
                    )}
                  />
                  {user.active ? "Activo" : "Inactivo"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatRelativeTime(user.lastActiveAt)}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" aria-label="Acciones" />}
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onToggleActive(user.id)}>
                      {user.active ? "Desactivar cuenta" : "Reactivar cuenta"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}