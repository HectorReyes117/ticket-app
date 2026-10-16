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
  type TicketQueryState,
} from "../services/ticketQuery";
import type { Ticket, TicketStatus, TicketView } from "@/types";
import type { DateRange } from "react-day-picker";

interface TicketsBrowserProps {
  tickets: Ticket[];
  /**
   * Design quick filters (Sin asignar / Urgentes / Cerradas). Off by default because
   * `Sin asignar` is meaningless on a page that only lists your own assignments.
   */
  showQuickFilters?: boolean;
  /** Inclusive created-at window owned by the page header. */
  createdRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export function TicketsBrowser({
  tickets,
  showQuickFilters = false,
  createdRange,
  onDateRangeChange,
}: TicketsBrowserProps) {
  const { user } = useAuth();
  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);
  const updateStatus = useTicketStore((state) => state.updateStatus);
  const navigate = useNavigate();

  const [filters, setFilters] = useState<TicketQueryState>(DEFAULT_TICKET_QUERY);
  const [internalRange, setInternalRange] = useState<DateRange | undefined>(createdRange);
  const [view, setView] = useState<TicketView>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setInternalRange(createdRange);
  }, [createdRange]);

  const activeRange = internalRange;

  const refreshTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
      }
    },
    [],
  );

  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const ticketsLoading = useTicketStore((state) => state.loading);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Map filters to backend query
      const params: any = {};
      if (filters.search.trim()) params.search = filters.search.trim();

      if (filters.pill !== "all") {
        if (filters.pill === "unassigned" || filters.pill === "urgent" || filters.pill === "closed") {
          // Handled as tab or specific filter
          params.status = filters.pill;
        } else {
          params.status = filters.pill;
        }
      }

      if (filters.priority !== "all") {
        params.priority = filters.priority;
      }

      if (filters.siteId !== "all") {
        params.locationId = parseInt(filters.siteId, 10);
      }

      if (filters.technicianId !== "all") {
        params.assigneeId = parseInt(filters.technicianId, 10);
      }

      fetchTickets(params);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, fetchTickets]);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );
  const sitesById = useMemo(
    () => Object.fromEntries(sites.map((s) => [s.id, s])),
    [sites],
  );
  const context = useMemo(
    () => ({ usersById, createdRange: activeRange }),
    [usersById, activeRange],
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

  const filtersActive = hasActiveFilters(filters) || Boolean(activeRange?.from || activeRange?.to);

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
    setInternalRange(undefined);
    onDateRangeChange?.(undefined);
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
        dateRange={activeRange}
        onDateRangeChange={(rng) => {
          setInternalRange(rng);
          onDateRangeChange?.(rng);
          setPage(1);
        }}
      />

      {ticketsLoading ? (
        <Card className="rounded-b-2xl rounded-t-none border-t-0 shadow-xs">
          <CardContent className="py-12 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <RefreshCw className="size-6 animate-spin text-brand" />
            <span className="text-xs font-semibold">Consultando solicitudes en tiempo real...</span>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="rounded-b-2xl rounded-t-none border-t-0 shadow-xs">
          <CardContent className="pt-6">
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
        <div className="pt-3">
          <TicketKanban
            tickets={pageTickets}
            usersList={users}
            sitesById={sitesById}
            onMove={handleMove}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-b-2xl border-b border-x border-border bg-card text-sm shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 bg-muted/20">
            <h2 className="text-sm font-bold text-foreground">
              Registro Operativo de Tickets
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Mostrando{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {pageTickets.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold tabular-nums text-foreground">
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
