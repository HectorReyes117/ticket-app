import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { SlaTimer } from "@/components/common/SlaTimer";
import { formatRelativeTime, formatTicketId } from "@/utils";
import type { Site, Ticket, User } from "@/types";

interface RecentTicketsProps {
  tickets: Ticket[];
  usersById: Record<string, User | undefined>;
  sitesById: Record<string, Site | undefined>;
}

export function RecentTickets({ tickets, usersById, sitesById }: RecentTicketsProps) {
  const navigate = useNavigate();

  return (
    <ul className="divide-y divide-border">
      {tickets.map((ticket) => {
        const requestor = usersById[ticket.requestorId];
        const site = sitesById[ticket.siteId];
        return (
          <li key={ticket.id}>
            <button
              type="button"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-accent/60"
            >
              <span className="flex flex-col gap-0.5 py-0.5">
                <span className="font-mono text-xs font-semibold tabular-nums text-brand-soft-fg">
                  {formatTicketId(ticket.sequence)}
                </span>
                <span className="text-xs text-muted-foreground">{site?.name ?? "—"}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {ticket.title}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{requestor?.name ?? "—"}</span>
                  <span aria-hidden>·</span>
                  <span>{formatRelativeTime(ticket.createdAt)}</span>
                </span>
              </span>
              <span className="hidden shrink-0 md:block">
                <PriorityBadge priority={ticket.priority} withLabel={false} />
              </span>
              <span className="hidden shrink-0 lg:block">
                <SlaTimer dueAt={ticket.slaDueAt} status={ticket.status} />
              </span>
              <StatusBadge status={ticket.status} />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}