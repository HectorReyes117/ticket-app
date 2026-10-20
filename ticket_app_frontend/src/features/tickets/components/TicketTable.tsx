import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { SlaTimer } from "@/components/common/SlaTimer";
import { useTicketStore } from "@/store";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import { formatDate, formatTicketId, cn } from "@/utils";
import type { Site, Ticket, User } from "@/types";

interface TicketTableProps {
  tickets: Ticket[];
  usersList: User[];
  sitesById: Record<string, Site | undefined>;
  /**
   * Drop the table's own bordered container so it can sit flush inside a parent card.
   * The caller then owns the surface, the rounding and the border.
   */
  plain?: boolean;
}

function AssigneeDropdown({
  ticket,
  usersById,
  technicians,
}: {
  ticket: Ticket;
  usersById: Record<string, User | undefined>;
  technicians: User[];
}) {
  const { user } = useAuth();
  const assignTicket = useTicketStore((state) => state.assignTicket);
  const [loading, setLoading] = useState(false);

  const assignee = ticket.assigneeId ? usersById[ticket.assigneeId] : undefined;

  const handleAssign = async (techId: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    if (techId === ticket.assigneeId || (!techId && !ticket.assigneeId)) return;

    try {
      setLoading(true);
      await assignTicket(ticket.id, techId, user?.id ?? "system");
      toast.add({
        title: techId ? "Técnico asignado" : "Ticket desasignado",
        description: techId
          ? `Se asignó a ${usersById[techId]?.name ?? "técnico"}.`
          : "El ticket quedó marcado como sin asignar.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Error al actualizar asignación",
        description: "No se pudo actualizar la asignación del ticket.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="inline-block"
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "group/btn inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-left text-sm transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            loading && "opacity-50 pointer-events-none"
          )}
        >
          {assignee ? (
            <span className="flex min-w-0 items-center gap-2">
              <UserAvatar
                name={assignee.name}
                avatarUrl={assignee.avatarUrl}
                color={assignee.color}
                presence={assignee.presence}
                size="sm"
              />
              <span className="truncate text-sm font-medium text-foreground group-hover/btn:text-brand">
                {assignee.name}
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover/btn:text-foreground">
              <UserPlus className="size-3.5 text-muted-foreground/70 group-hover/btn:text-brand" />
              <span>Sin asignar</span>
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 max-h-72 overflow-y-auto">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            Asignar especialista
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={(e) => handleAssign(null, e)}
            className="flex items-center justify-between gap-2 py-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <span className="size-6 rounded-full border border-dashed border-border flex items-center justify-center text-xs">
                ∅
              </span>
              <span className="text-sm font-medium">Sin asignar</span>
            </span>
            {!ticket.assigneeId ? (
              <Check className="size-4 shrink-0 text-brand" />
            ) : null}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {technicians.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No hay técnicos disponibles
            </div>
          ) : (
            technicians.map((tech) => {
              const isCurrent = tech.id === ticket.assigneeId;
              return (
                <DropdownMenuItem
                  key={tech.id}
                  onClick={(e) => handleAssign(tech.id, e)}
                  className="flex items-center justify-between gap-2 py-1.5 cursor-pointer"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <UserAvatar
                      name={tech.name}
                      avatarUrl={tech.avatarUrl}
                      color={tech.color}
                      presence={tech.presence}
                      size="sm"
                    />
                    <span className="truncate text-sm text-foreground">
                      {tech.name}
                    </span>
                  </span>

                  {isCurrent ? (
                    <Check className="size-4 shrink-0 text-brand" />
                  ) : null}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function TicketTable({
  tickets,
  usersList,
  sitesById,
  plain = false,
}: TicketTableProps) {
  const navigate = useNavigate();
  const usersById = useMemo(
    () => Object.fromEntries(usersList.map((u) => [u.id, u])),
    [usersList],
  );

  const technicians = useMemo(
    () =>
      usersList
        .filter((u) => u.role === "technician" || u.role === "admin")
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [usersList],
  );

  const table = (
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
                        avatarUrl={requestor.avatarUrl}
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
                  <AssigneeDropdown
                    ticket={ticket}
                    usersById={usersById}
                    technicians={technicians}
                  />
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
                  <SlaTimer dueAt={ticket.slaDueAt} status={ticket.status} />
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
  );

  if (plain) return table;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {table}
    </div>
  );
}