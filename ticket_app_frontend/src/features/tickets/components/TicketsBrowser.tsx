import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { TicketTable } from "./TicketTable";
import { TicketKanban } from "./TicketKanban";
import { TicketsToolbar } from "./TicketsToolbar";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { useAuth } from "@/context/auth-context";
import {
  DEFAULT_TICKET_QUERY,
  applyTicketQuery,
  buildPillOptions,
  hasActiveFilters,
  isQuickFilter,
  type TicketQueryState,
} from "../services/ticketQuery";
import type { Ticket, TicketStatus, TicketView } from "@/types";

interface TicketsBrowserProps {
  tickets: Ticket[];
  /**
   * Design quick filters (Sin asignar / Urgentes / Cerradas). Off by default because
   * `Sin asignar` is meaningless on a page that only lists your own assignments.
   */
  showQuickFilters?: boolean;
}

export function TicketsBrowser({
  tickets,
  showQuickFilters = false,
}: TicketsBrowserProps) {
  const { user } = useAuth();
  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);
  const updateStatus = useTicketStore((state) => state.updateStatus);
  const navigate = useNavigate();

  const [filters, setFilters] = useState<TicketQueryState>(DEFAULT_TICKET_QUERY);
  const [view, setView] = useState<TicketView>("table");

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );
  const sitesById = useMemo(
    () => Object.fromEntries(sites.map((s) => [s.id, s])),
    [sites],
  );
  const context = useMemo(() => ({ usersById }), [usersById]);

  const filtered = useMemo(
    () => applyTicketQuery(tickets, filters, context),
    [tickets, filters, context],
  );

  const pillOptions = useMemo(() => {
    const options = buildPillOptions(tickets, filters, context);
    if (showQuickFilters) return options;
    return options.filter((option) => !isQuickFilter(option.value));
  }, [tickets, filters, context, showQuickFilters]);

  const areaOptions = useMemo(
    () =>
      [...new Set(tickets.map((ticket) => ticket.area))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "es")),
    [tickets],
  );

  const technicians = useMemo(
    () =>
      users
        .filter((item) => item.role === "technician")
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [users],
  );

  const filtersActive = hasActiveFilters(filters);

  const handleChange = (patch: Partial<TicketQueryState>) =>
    setFilters((current) => ({ ...current, ...patch }));

  const handleClear = () =>
    setFilters((current) => ({ ...DEFAULT_TICKET_QUERY, sort: current.sort }));

  const handleMove = (ticketId: string, nextStatus: TicketStatus) => {
    updateStatus(ticketId, nextStatus, user?.id ?? "system");
  };

  return (
    <div className="space-y-4">
      <TicketsToolbar
        filters={filters}
        onChange={handleChange}
        onClear={handleClear}
        filtersActive={filtersActive}
        pillOptions={pillOptions}
        areaOptions={areaOptions}
        technicians={technicians}
        sites={sites}
        view={view}
        onViewChange={setView}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Inbox className="size-6" />}
              title="No se encontraron solicitudes"
              description={
                filtersActive
                  ? "Ajusta los filtros o el término de búsqueda."
                  : "Aún no hay solicitudes registradas."
              }
              action={
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => navigate("/tickets/new")}
                >
                  <FilePlus2 className="size-4" />
                  Crear solicitud
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : view === "table" ? (
        <TicketTable tickets={filtered} usersList={users} sitesById={sitesById} />
      ) : (
        <TicketKanban
          tickets={filtered}
          usersList={users}
          sitesById={sitesById}
          onMove={handleMove}
        />
      )}
    </div>
  );
}
