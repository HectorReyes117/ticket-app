import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ChevronRight,
  Download,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { TicketsTableFooter } from "@/features/tickets/components/TicketsTableFooter";
import { DEFAULT_PAGE_SIZE } from "@/features/tickets/services/ticketQuery";
import { SiteFormSheet } from "@/features/sites/components/SiteFormSheet";
import { useSiteStore, useUserStore } from "@/store";
import { cn } from "@/utils";

export function SitesPage() {
  const sites = useSiteStore((state) => state.items);
  const users = useUserStore((state) => state.items);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const managersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );

  // Filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchSearch =
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && site.active) ||
        (statusFilter === "inactive" && !site.active);

      return matchSearch && matchStatus;
    });
  }, [sites, searchQuery, statusFilter]);

  // Pagination calculations
  const pageCount = Math.max(1, Math.ceil(filteredSites.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pagedSites = filteredSites.slice(start, start + pageSize);
  const from = filteredSites.length === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, filteredSites.length);

  const handleRefresh = () => {
    setPage(1);
    setRefreshing(true);
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
    }
    refreshTimer.current = window.setTimeout(() => {
      refreshTimer.current = null;
      setRefreshing(false);
      toast.add({
        title: "Sedes actualizadas",
        description: "Se han recargado las sedes y ubicaciones registradas.",
        type: "info",
      });
    }, 500);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  // Reset page when search or status filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setPage(1);
  };

  // Total areas / spaces
  const totalAreas = useMemo(() => {
    return sites.reduce((acc, site) => acc + (site.areas?.length || 0), 0);
  }, [sites]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Sub-header / Breadcrumbs & Action Bar exact to Stitch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Configuración Corporativa
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className="font-semibold text-brand">Sedes & Infraestructura Física</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gestión de Sedes y Ubicaciones Físicas
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Administración de campus, edificios, pisos, salas técnicas y centros de datos para el enrutamiento de solicitudes.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              toast.add({
                title: "Exportando inventario",
                description: "Generando archivo CSV de sedes e instalaciones...",
                type: "info",
              })
            }
            className="gap-2 text-xs font-semibold rounded-xl border-border bg-card shadow-xs"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Exportar Inventario</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setSheetOpen(true)}
            className="gap-2 text-xs font-semibold rounded-xl bg-brand hover:bg-brand-hover text-white shadow-xs"
          >
            <Plus className="size-4" />
            <span>+ Nueva Sede / Ubicación</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Grid (3 cards from Stitch) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Total Sedes */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Total Sedes Corporativas</span>
            <div className="size-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {sites.length}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-soft text-brand-soft-fg font-semibold">
                <TrendingUp className="size-3" />
                <span>+2 nuevas</span>
              </span>
              <span className="text-muted-foreground">este período</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Ubicaciones & Espacios */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Ubicaciones & Espacios</span>
            <div className="size-10 rounded-xl bg-muted text-foreground flex items-center justify-center">
              <Layers className="size-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {totalAreas || 18}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand" />
              <span>Pisos, salas y centros de datos</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Responsables / Custodios */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Responsables / Custodios</span>
            <div className="size-10 rounded-xl bg-muted text-foreground flex items-center justify-center">
              <UserCheck className="size-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {users.filter((u) => u.role === "technician" || u.role === "admin").length || 8}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-brand" />
              <span>Coordinadores asignados en sitio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card Wrapper exact to Stitch */}
      <div className="bg-card rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
        {/* Category Tabs Navigation */}
        <div className="px-5 pt-3 bg-muted/40 border-b border-border flex flex-wrap items-center gap-1">
          {[
            { key: "all", label: "Todas", count: sites.length },
            { key: "main", label: "Sedes Principales", count: Math.ceil(sites.length / 2) },
            { key: "dc", label: "Centros de Datos", count: 1 },
            { key: "regional", label: "Sucursales", count: Math.floor(sites.length / 2) },
          ].map((tab) => {
            const isActive = categoryFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleCategoryFilterChange(tab.key)}
                className={cn(
                  "px-4 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-2 transition-colors border-b-2",
                  isActive
                    ? "bg-card text-brand border-brand shadow-xs"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/60",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px]",
                    isActive ? "bg-brand text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filters Tool Bar with Refresh & Showing Counter (same as Tickets Page) */}
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border-b border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por nombre de sede, ciudad, dirección o código..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="bg-muted/60 text-foreground text-xs font-medium rounded-xl px-3 py-2 border border-border focus:ring-1 focus:ring-brand"
            >
              <option value="all">Estado: Todos</option>
              <option value="active">Operativo / Activo</option>
              <option value="inactive">Inactivo</option>
            </select>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Mostrando{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {pagedSites.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {filteredSites.length}
                </span>
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Refrescar sedes"
                title="Refrescar sedes"
              >
                <RefreshCw
                  className={cn("size-4", refreshing && "animate-spin")}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table View */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-[11px] font-bold uppercase tracking-wider border-b border-border">
                <th className="py-3 px-5">Sede / Código</th>
                <th className="py-3 px-4">Ciudad / Dirección</th>
                <th className="py-3 px-4">Ubicaciones / Niveles</th>
                <th className="py-3 px-4">Contacto / Responsable</th>
                <th className="py-3 px-4">Capacidad / Ocupación</th>
                <th className="py-3 px-4">Estado Operativo</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {pagedSites.map((site, index) => {
                const manager = site.managers && site.managers.length > 0
                  ? managersById[site.managers[0]]
                  : users[0];

                return (
                  <tr key={site.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Building2 className="size-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground text-xs leading-tight hover:text-brand cursor-pointer">
                            {site.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-brand font-mono font-semibold">
                              #SED-00{index + 1}
                            </span>
                            <span className="text-muted-foreground/60">•</span>
                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
                              Campus Corporativo
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground">{site.address}</span>
                        <span className="text-[11px] text-muted-foreground">{site.city}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 max-w-xs">
                        <span className="font-semibold text-foreground">
                          {site.areas.length} Niveles Habilitados
                        </span>
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px] truncate">
                          {site.areas.slice(0, 2).join(" • ")}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-brand-soft text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(manager?.name ?? "MM")
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">
                            {manager?.name ?? "Marcela Morales"}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            Custodio • {site.phone || "Ext. 4412"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5 w-36">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-foreground">350 Colab.</span>
                          <span className="text-muted-foreground">80%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-brand h-full rounded-full" style={{ width: "80%" }} />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                          site.active
                            ? "bg-brand-soft text-brand-soft-fg"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            site.active ? "bg-brand animate-pulse" : "bg-muted-foreground",
                          )}
                        />
                        <span>{site.active ? "Operativo" : "Inactivo"}</span>
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground">
                        <button
                          type="button"
                          title="Ver detalles"
                          onClick={() =>
                            toast.add({
                              title: site.name,
                              description: `${site.address}, ${site.city}`,
                              type: "info",
                            })
                          }
                          className="p-1.5 hover:text-brand hover:bg-muted rounded-lg transition-colors"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          title="Editar sede"
                          onClick={() => setSheetOpen(true)}
                          className="p-1.5 hover:text-brand hover:bg-muted rounded-lg transition-colors"
                        >
                          <Edit className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination and rows per page (matching Tickets page) */}
        <TicketsTableFooter
          from={from}
          to={to}
          total={filteredSites.length}
          page={currentPage}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Drawer Panel CRUD for Creating/Editing Sede */}
      <SiteFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}