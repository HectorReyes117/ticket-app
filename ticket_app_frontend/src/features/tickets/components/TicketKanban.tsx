import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { SlaTimer } from "@/components/common/SlaTimer";
import { formatTicketId, STATUS_META, TICKET_STATUSES, cn } from "@/utils";
import type { Site, Ticket, TicketStatus, User } from "@/types";

interface TicketKanbanCardProps {
  ticket: Ticket;
  requestor?: User;
  assignee?: User;
  site?: Site;
  onMove: (status: TicketStatus) => void;
}

export function TicketKanbanCard({
  ticket,
  requestor,
  assignee,
  site,
  onMove,
}: TicketKanbanCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="group w-full rounded-xl border border-border bg-card p-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-brand/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-semibold tabular-nums text-brand-soft-fg">
          {formatTicketId(ticket.sequence)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(event) => event.stopPropagation()}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Mover solicitud"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {TICKET_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                disabled={status === ticket.status}
                onClick={() => onMove(status)}
              >
                <span
                  className={cn("size-1.5 rounded-full", STATUS_META[status].dot)}
                />
                {STATUS_META[status].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
        {ticket.title}
      </p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <PriorityBadge priority={ticket.priority} withLabel={false} />
        <SlaTimer dueAt={ticket.slaDueAt} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="flex items-center gap-2">
          {assignee ? (
            <UserAvatar name={assignee.name} color={assignee.color} size="xs" />
          ) : (
            <UserAvatar name={requestor?.name ?? "?"} color={requestor?.color} size="xs" />
          )}
          <span className="text-xs text-muted-foreground">
            {assignee ? assignee.name.split(" ")[0] : "Sin asignar"}
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          {site?.name ?? "—"}
        </span>
      </div>
    </button>
  );
}

interface TicketKanbanProps {
  tickets: Ticket[];
  usersList: User[];
  sitesById: Record<string, Site | undefined>;
  onMove: (ticketId: string, status: TicketStatus) => void;
}

export function TicketKanban({
  tickets,
  usersList,
  sitesById,
  onMove,
}: TicketKanbanProps) {
  const usersById = useMemo(
    () => Object.fromEntries(usersList.map((u) => [u.id, u])),
    [usersList],
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {TICKET_STATUSES.map((status) => {
        const columnTickets = tickets.filter((t) => t.status === status);
        return (
          <div
            key={status}
            className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/60 p-3"
          >
            <div className="flex items-center gap-2 px-1 pb-1">
              <span
                className={cn("size-2 rounded-full", STATUS_META[status].dot)}
              />
              <span className="text-sm font-semibold text-foreground">
                {STATUS_META[status].label}
              </span>
              <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground ring-1 ring-border">
                {columnTickets.length}
              </span>
            </div>
            {columnTickets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                Sin solicitudes
              </div>
            ) : (
              columnTickets.map((ticket) => (
                <TicketKanbanCard
                  key={ticket.id}
                  ticket={ticket}
                  requestor={usersById[ticket.requestorId]}
                  assignee={ticket.assigneeId ? usersById[ticket.assigneeId] : undefined}
                  site={sitesById[ticket.siteId]}
                  onMove={(status) => onMove(ticket.id, status)}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}