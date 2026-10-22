import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/common/UserAvatar";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { SlaTimer } from "@/components/common/SlaTimer";
import { useAuth } from "@/context/auth-context";
import { formatTicketId, STATUS_META, TICKET_STATUSES, cn } from "@/utils";
import type { Site, Ticket, TicketStatus, User } from "@/types";

interface TicketKanbanCardProps {
  ticket: Ticket;
  requestor?: User;
  assignee?: User;
  site?: Site;
  onMove: (status: TicketStatus) => void;
  isDragging?: boolean;
  canChangeStatus?: boolean;
}

export function TicketKanbanCard({
  ticket,
  requestor,
  assignee,
  site,
  onMove,
  isDragging,
  canChangeStatus = true,
}: TicketKanbanCardProps) {
  const navigate = useNavigate();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canChangeStatus) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", ticket.id);
    e.dataTransfer.setData("application/json", JSON.stringify({ id: ticket.id, currentStatus: ticket.status }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if clicking card body directly, not dropdown or buttons
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-navigate]")) {
      return;
    }
    navigate(`/tickets/${ticket.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={canChangeStatus}
      onDragStart={handleDragStart}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/tickets/${ticket.id}`);
        }
      }}
      className={cn(
        "group w-full rounded-xl border border-border bg-card p-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-brand/40 hover:shadow-sm select-none",
        canChangeStatus ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging && "opacity-40 border-dashed border-brand"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-semibold tabular-nums text-brand-soft-fg">
          {formatTicketId(ticket.sequence)}
        </span>
        {canChangeStatus && (
          <div data-no-navigate className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(event) => {
                  event.stopPropagation();
                }}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                aria-label="Mover solicitud"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {TICKET_STATUSES.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    disabled={status === ticket.status}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(status);
                    }}
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
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
        {ticket.title}
      </p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <PriorityBadge priority={ticket.priority} withLabel={false} />
        <SlaTimer dueAt={ticket.slaDueAt} status={ticket.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="flex items-center gap-2">
          {assignee ? (
            <UserAvatar name={assignee.name} avatarUrl={assignee.avatarUrl} color={assignee.color} size="xs" />
          ) : (
            <UserAvatar name={requestor?.name ?? "?"} avatarUrl={requestor?.avatarUrl} color={requestor?.color} size="xs" />
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
    </div>
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
  const { user } = useAuth();
  const canChangeStatus = user?.role === "technician" || user?.role === "admin" || user?.role === "director";

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);

  const usersById = useMemo(
    () => Object.fromEntries(usersList.map((u) => [u.id, u])),
    [usersList],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => {
    if (!canChangeStatus) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => {
    if (!canChangeStatus) return;
    // Only clear if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TicketStatus) => {
    if (!canChangeStatus) return;
    e.preventDefault();
    setDragOverColumn(null);
    setActiveDragId(null);

    const ticketId = e.dataTransfer.getData("text/plain");
    if (!ticketId) return;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket && ticket.status !== targetStatus) {
      onMove(ticketId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {TICKET_STATUSES.map((status) => {
        const columnTickets = tickets.filter((t) => t.status === status);
        const isColumnTarget = dragOverColumn === status;

        return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={(e) => handleDragLeave(e, status)}
            onDrop={(e) => handleDrop(e, status)}
            className={cn(
              "flex flex-col gap-2.5 rounded-xl border border-border bg-muted/60 p-3 min-h-[350px] transition-colors",
              isColumnTarget && "bg-brand-soft/50 border-brand/60 ring-2 ring-brand/20"
            )}
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
              <div
                className={cn(
                  "flex-1 flex items-center justify-center rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground transition-colors",
                  isColumnTarget && "border-brand text-brand font-medium bg-card/60"
                )}
              >
                {isColumnTarget ? "Soltar aquí para mover" : "Sin solicitudes"}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 flex-1">
                {columnTickets.map((ticket) => (
                  <TicketKanbanCard
                    key={ticket.id}
                    ticket={ticket}
                    isDragging={activeDragId === ticket.id}
                    requestor={usersById[ticket.requestorId]}
                    assignee={ticket.assigneeId ? usersById[ticket.assigneeId] : undefined}
                    site={sitesById[ticket.siteId]}
                    onMove={(newStatus) => onMove(ticket.id, newStatus)}
                    canChangeStatus={canChangeStatus}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}