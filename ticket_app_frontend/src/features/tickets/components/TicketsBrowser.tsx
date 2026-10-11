import { useMemo, useState } from "react";
import { FilePlus2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/common/SearchInput";
import { FilterPills } from "@/components/common/FilterPills";
import { ViewToggle } from "@/components/common/ViewToggle";
import { EmptyState } from "@/components/common/EmptyState";
import { TicketTable } from "./TicketTable";
import { TicketKanban } from "./TicketKanban";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { useAuth } from "@/context/auth-context";
import { STATUS_META, TICKET_STATUSES } from "@/utils";
import type { Priority, Ticket, TicketStatus, TicketView } from "@/types";

interface TicketsBrowserProps {
  tickets: Ticket[];
}

export function TicketsBrowser({ tickets }: TicketsBrowserProps) {
  const { user } = useAuth();
  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);
  const updateStatus = useTicketStore((state) => state.updateStatus);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [siteId, setSiteId] = useState<string>("all");
  const [view, setView] = useState<TicketView>("table");

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );
  const sitesById = useMemo(
    () => Object.fromEntries(sites.map((s) => [s.id, s])),
    [sites],
  );

  const normalized = useMemo(() => search.trim().toLowerCase(), [search]);

  const filtered = useMemo(() => {
    return [...tickets]
      .filter((ticket) => {
        if (status !== "all" && ticket.status !== status) return false;
        if (priority !== "all" && ticket.priority !== priority) return false;
        if (siteId !== "all" && ticket.siteId !== siteId) return false;
        if (normalized) {
          const requestor = usersById[ticket.requestorId]?.name.toLowerCase() ?? "";
          const haystack = `${ticket.id} ${ticket.title} ${ticket.category} ${requestor}`.toLowerCase();
          if (!haystack.includes(normalized)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tickets, status, priority, siteId, normalized, usersById]);

  const handleMove = (ticketId: string, nextStatus: TicketStatus) => {
    updateStatus(ticketId, nextStatus, user?.id ?? "system");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por ID, título o solicitante…"
              className="w-full sm:w-72"
              label="Buscar solicitudes"
            />
            <Select value={priority} onValueChange={(value) => setPriority((value ?? "all") as Priority | "all")}>
              <SelectTrigger className="w-36" aria-label="Filtrar por prioridad">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={siteId} onValueChange={(value) => setSiteId(value ?? "all")}>
              <SelectTrigger className="w-44" aria-label="Filtrar por sede">
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sedes</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ViewToggle value={view} onValueChange={setView} />
        </CardContent>
      </Card>

      <FilterPills
        ariaLabel="Filtrar por estado"
        options={[
          { value: "all", label: "Todas" },
          ...TICKET_STATUSES.map((value) => ({
            value,
            label: STATUS_META[value].label,
          })),
        ]}
        value={status}
        onValueChange={(value) => setStatus(value as TicketStatus | "all")}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Inbox className="size-6" />}
              title="No se encontraron solicitudes"
              description={
                normalized || status !== "all" || priority !== "all"
                  ? "Ajusta los filtros o el término de búsqueda."
                  : "Aún no hay solicitudes registradas."
              }
              action={
                <Button variant="outline" className="gap-1.5">
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