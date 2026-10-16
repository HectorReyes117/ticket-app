import { ArrowUpDown, FilterX, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ViewToggle } from "@/components/common/ViewToggle";
import { DateRangeFilter } from "@/components/common/DateRangeFilter/DateRangeFilter";
import { PRIORITIES, PRIORITY_META, cn } from "@/utils";
import type { Site, TicketView, User } from "@/types";
import {
  TICKET_SORT_OPTIONS,
  type TicketPillFilter,
  type TicketQueryState,
  type TicketSortKey,
} from "../services/ticketQuery";
import type { FilterPill } from "@/components/common/FilterPills";
import type { DateRange } from "react-day-picker";

interface TicketsToolbarProps {
  filters: TicketQueryState;
  onChange: (patch: Partial<TicketQueryState>) => void;
  onClear: () => void;
  filtersActive: boolean;
  pillOptions: FilterPill[];
  areaOptions: string[];
  technicians: User[];
  sites: Site[];
  view: TicketView;
  onViewChange: (view: TicketView) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export function TicketsToolbar({
  filters,
  onChange,
  onClear,
  filtersActive,
  pillOptions,
  areaOptions,
  technicians,
  sites,
  view,
  onViewChange,
  dateRange,
  onDateRangeChange,
}: TicketsToolbarProps) {
  return (
    <div className="bg-card rounded-t-2xl border-t border-x border-border shadow-xs flex flex-col overflow-hidden">
      {/* Role / Status Navigation Tabs (Same style as Personal y Usuarios) */}
      <div className="px-5 pt-3 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {pillOptions.map((tab) => {
            const isActive = filters.pill === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onChange({ pill: tab.value as TicketPillFilter })}
                className={cn(
                  "px-4 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-2 transition-colors border-b-2",
                  isActive
                    ? "bg-card text-brand border-brand shadow-xs"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/60",
                )}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px]",
                      isActive ? "bg-brand text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Toggle (Table / Kanban) */}
        <div className="pb-2">
          <ViewToggle value={view} onValueChange={onViewChange} />
        </div>
      </div>

      {/* Filter Controls Row matching Personal y Usuarios */}
      <div className="p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border-b border-border">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por asunto, solicitante, ID o código..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="pl-9 text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sede */}
          <select
            value={filters.siteId}
            onChange={(e) => onChange({ siteId: e.target.value })}
            className="bg-muted/60 text-foreground text-xs font-medium rounded-xl px-3 py-2 border border-border focus:ring-1 focus:ring-brand"
          >
            <option value="all">Sede: Todas</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>

          {/* Área */}
          <select
            value={filters.area}
            onChange={(e) => onChange({ area: e.target.value })}
            className="bg-muted/60 text-foreground text-xs font-medium rounded-xl px-3 py-2 border border-border focus:ring-1 focus:ring-brand"
          >
            <option value="all">Área: Todas</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          {/* Prioridad */}
          <select
            value={filters.priority}
            onChange={(e) =>
              onChange({ priority: e.target.value as TicketQueryState["priority"] })
            }
            className="bg-muted/60 text-foreground text-xs font-medium rounded-xl px-3 py-2 border border-border focus:ring-1 focus:ring-brand"
          >
            <option value="all">Prioridad: Todas</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_META[priority].label}
              </option>
            ))}
          </select>

          {/* Técnico */}
          <select
            value={filters.technicianId}
            onChange={(e) => onChange({ technicianId: e.target.value })}
            className="bg-muted/60 text-foreground text-xs font-medium rounded-xl px-3 py-2 border border-border focus:ring-1 focus:ring-brand"
          >
            <option value="all">Técnico: Cualquiera</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.name}
              </option>
            ))}
          </select>

          {/* Filtro por Rango de Fechas */}
          {onDateRangeChange && (
            <DateRangeFilter
              value={dateRange}
              onChange={onDateRangeChange}
              className="text-xs"
            />
          )}

          {/* Ordenar por */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-border">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <select
              value={filters.sort}
              onChange={(e) => onChange({ sort: e.target.value as TicketSortKey })}
              className="bg-muted/60 text-foreground text-xs font-medium rounded-xl px-2.5 py-2 border border-border focus:ring-1 focus:ring-brand"
            >
              {TICKET_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Limpiar Filtros */}
          <button
            type="button"
            onClick={onClear}
            disabled={!filtersActive}
            title="Limpiar filtros"
            className={cn(
              "p-2 rounded-xl border border-border transition-colors",
              filtersActive
                ? "text-brand hover:bg-brand-soft/50 border-brand/40 cursor-pointer"
                : "text-muted-foreground/40 border-border/50 cursor-not-allowed",
            )}
          >
            <FilterX className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
