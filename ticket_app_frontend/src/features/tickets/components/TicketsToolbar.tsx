import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FilterPills, type FilterPill } from "@/components/common/FilterPills";
import { SearchInput } from "@/components/common/SearchInput";
import { ViewToggle } from "@/components/common/ViewToggle";
import { PRIORITIES, PRIORITY_META } from "@/utils";
import type { Site, TicketView, User } from "@/types";
import {
  TICKET_SORT_OPTIONS,
  type TicketPillFilter,
  type TicketQueryState,
  type TicketSortKey,
} from "../services/ticketQuery";

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
}: TicketsToolbarProps) {
  return (
    <div className="space-y-3">
      <FilterPills
        ariaLabel="Filtrar por estado"
        options={pillOptions}
        value={filters.pill}
        onValueChange={(value) => onChange({ pill: value as TicketPillFilter })}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <SearchInput
              value={filters.search}
              onChange={(search) => onChange({ search })}
              placeholder="Filtrar por asunto, solicitante o ID…"
              className="w-full sm:w-72"
              label="Buscar solicitudes"
            />

            <Select
              value={filters.area}
              onValueChange={(value) => onChange({ area: value ?? "all" })}
              items={[
                { value: "all", label: "Todas las áreas" },
                ...areaOptions.map((area) => ({ value: area, label: area })),
              ]}
            >
              <SelectTrigger className="w-44" aria-label="Filtrar por área">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areaOptions.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) =>
                onChange({ priority: (value ?? "all") as TicketQueryState["priority"] })
              }
              items={[
                { value: "all", label: "Todas las prioridades" },
                ...PRIORITIES.map((priority) => ({
                  value: priority,
                  label: PRIORITY_META[priority].label,
                })),
              ]}
            >
              <SelectTrigger className="w-40" aria-label="Filtrar por prioridad">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {PRIORITY_META[priority].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.technicianId}
              onValueChange={(value) => onChange({ technicianId: value ?? "all" })}
              items={[
                { value: "all", label: "Cualquier técnico" },
                ...technicians.map((technician) => ({
                  value: technician.id,
                  label: technician.name,
                })),
              ]}
            >
              <SelectTrigger className="w-40" aria-label="Filtrar por técnico">
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquier técnico</SelectItem>
                {technicians.map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.siteId}
              onValueChange={(value) => onChange({ siteId: value ?? "all" })}
              items={[
                { value: "all", label: "Todas las sedes" },
                ...sites.map((site) => ({ value: site.id, label: site.name })),
              ]}
            >
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

            <Select
              value={filters.sort}
              onValueChange={(value) =>
                onChange({ sort: (value ?? "recent") as TicketSortKey })
              }
              items={TICKET_SORT_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            >
              <SelectTrigger className="w-44" aria-label="Ordenar por">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              disabled={!filtersActive}
              className="gap-1.5"
            >
              <RotateCcw className="size-4" />
              Limpiar filtros
            </Button>
          </div>

          <ViewToggle value={view} onValueChange={onViewChange} />
        </CardContent>
      </Card>
    </div>
  );
}
