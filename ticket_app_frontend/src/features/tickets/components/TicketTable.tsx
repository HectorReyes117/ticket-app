import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { SlaTimer } from "@/components/common/SlaTimer";
import { formatDate, formatTicketId } from "@/utils";
import type { Site, Ticket, User } from "@/types";

interface TicketTableProps {
  tickets: Ticket[];
  usersList: User[];
  sitesById: Record<string, Site | undefined>;
}

function AssigneeCell({
  assigneeId,
  usersById,
}: {
  assigneeId?: string;
  usersById: Record<string, User | undefined>;
}) {
  const assignee = assigneeId ? usersById[assigneeId] : undefined;
  if (!assignee) {
    return (
      <span className="text-sm text-muted-foreground">Sin asignar</span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <UserAvatar
        name={assignee.name}
        color={assignee.color}
        presence={assignee.presence}
        size="sm"
      />
      <span className="truncate text-sm text-foreground">{assignee.name}</span>
    </span>
  );
}

export function TicketTable({
  tickets,
  usersList,
  sitesById,
}: TicketTableProps) {
  const navigate = useNavigate();
  const usersById = useMemo(
    () => Object.fromEntries(usersList.map((u) => [u.id, u])),
    [usersList],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[190px]">Solicitud</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Asignado a</TableHead>
            <TableHead>Sede</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead className="text-right">Creada</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const requestor = usersById[ticket.requestorId];
            const site = sitesById[ticket.siteId];
            return (
              <TableRow
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="group cursor-pointer"
              >
                <TableCell>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-mono text-xs font-semibold tabular-nums text-brand-soft-fg">
                      {formatTicketId(ticket.sequence)}
                    </span>
                    <span className="max-w-[240px] truncate text-sm font-medium text-foreground">
                      {ticket.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {requestor ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <UserAvatar
                        name={requestor.name}
                        color={requestor.color}
                        size="sm"
                      />
                      <span className="truncate text-sm text-foreground">
                        {requestor.name}
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <AssigneeCell assigneeId={ticket.assigneeId} usersById={usersById} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {site?.name ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>
                  <SlaTimer dueAt={ticket.slaDueAt} />
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm whitespace-nowrap text-muted-foreground">
                    {formatDate(ticket.createdAt, { month: "short", day: "2-digit" })}
                  </span>
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}