import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { TicketTable } from "./TicketTable";
import { TicketKanban } from "./TicketKanban";
import { TicketsToolbar } from "./TicketsToolbar";
import { TicketsTableFooter } from "./TicketsTableFooter";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/utils";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_TICKET_QUERY,
  applyTicketQuery,
  buildPillOptions,
  hasActiveFilters,
  isQuickFilter,
  type TicketDateRange,
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
  /** Inclusive created-at window owned by the page header. */
  createdRange?: TicketDateRange;
}

export function TicketsBrowser({
  tickets,
  showQuickFilters = false,
  createdRange,
}: TicketsBrowserProps) {
  const { user } = useAuth();
  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);
  const updateStatus = useTicketStore((state) => state.updateStatus);
  const navigate = useNavigate();

  const [filters, setFilters] = useState<TicketQueryState>(DEFAULT_TICKET_QUERY);
  const [view, setView] = useState<TicketView>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);

  const refreshTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
      }
    },
    [],
  );

  // A date-range change comes from the page header, not from the toolbar, so reset paging here.
  const [lastRange, setLastRange] = useState(createdRange);
  if (lastRange !== createdRange) {
    setLastRange(createdRange);
    setPage(1);
  }

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );
  const sitesById = useMemo(
    () => Object.fromEntries(sites.map((s) => [s.id, s])),
    [sites],
  );
  const context = useMemo(
    () => ({ usersById, createdRange }),
    [usersById, createdRange],
  );

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageTickets =
    view === "table" ? filtered.slice(start, start + pageSize) : filtered;
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, filtered.length);

  const handleChange = (patch: Partial<TicketQueryState>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const handleClear = () => {
    setFilters((current) => ({ ...DEFAULT_TICKET_QUERY, sort: current.sort }));
    setPage(1);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  /**
   * There is no tickets backend yet, so refreshing re-reads the (already reactive) local
   * store and returns to the first page. It must never call `seedTickets()`: that would
   * discard tickets created or edited during the session. Swap for a real refetch when the
   * API lands.
   */
  const handleRefresh = () => {
    setPage(1);
    setRefreshing(true);
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
    }
    refreshTimer.current = window.setTimeout(() => {
      refreshTimer.current = null;
      setRefreshing(false);
    }, 500);
  };

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
      ) : view === "kanban" ? (
        <TicketKanban
          tickets={pageTickets}
          usersList={users}
          sitesById={sitesById}
          onMove={handleMove}
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card text-sm ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">
              Registro de Tickets
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Mostrando{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {pageTickets.length}
                </span>{" "}
                de{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {filtered.length}
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Refrescar solicitudes"
                title="Refrescar solicitudes"
              >
                <RefreshCw
                  className={cn("size-4", refreshing && "animate-spin")}
                />
              </Button>
            </div>
          </div>

          <TicketTable
            plain
            tickets={pageTickets}
            usersList={users}
            sitesById={sitesById}
          />

          <TicketsTableFooter
            from={from}
            to={to}
            total={filtered.length}
            page={currentPage}
            pageCount={pageCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
