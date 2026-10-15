import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FilterX,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { TicketsTableFooter } from "@/features/tickets/components/TicketsTableFooter";
import { DEFAULT_PAGE_SIZE } from "@/features/tickets/services/ticketQuery";
import { UserFormSheet } from "@/features/users/components/UserFormSheet";
import { useSiteStore, useUserStore } from "@/store";
import { ROLE_META, cn } from "@/utils";
import type { User } from "@/types";

export function UsersPage() {
  const users = useUserStore((state) => state.items);
  const loading = useUserStore((state) => state.loading);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const sites = useSiteStore((state) => state.items);
  const toggleActive = useUserStore((state) => state.toggleActive);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleTab, setRoleTab] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params: any = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleTab !== "all" && roleTab !== "inactive") {
        params.role = roleTab;
      }
      if (roleTab === "inactive") {
        params.activeOnly = false;
      } else if (statusFilter === "active") {
        params.activeOnly = true;
      } else if (statusFilter === "inactive") {
        params.activeOnly = false;
      }

      if (siteFilter !== "all") {
        params.locationId = parseInt(siteFilter, 10);
      }

      fetchUsers(params);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, roleTab, siteFilter, statusFilter, fetchUsers]);

  useEffect(
    () => () => {
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
      }
    },
    [],
  );

  const sitesById = useMemo(
    () => Object.fromEntries(sites.map((s) => [s.id, s])),
    [sites],
  );

  // Counts for KPIs
  const totalUsers = users.length;
  const techniciansCount = users.filter((u) => u.role === "technician").length;
  const requestorsCount = users.filter((u) => u.role === "requestor").length;
  const adminsCount = users.filter((u) => u.role === "admin" || u.role === "director").length;
  const inactiveCount = users.filter((u) => !u.active).length;

  // Pagination slice
  const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pagedUsers = users.slice(start, start + pageSize);
  const from = users.length === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, users.length);

  const handleRefresh = async () => {
    setPage(1);
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    toast.add({
      title: "Directorio actualizado",
      description: "Se han recargado los colaboradores y roles en tiempo real.",
      type: "info",
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleTab("all");
    setSiteFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const openNewUserModal = () => {
    setUserToEdit(null);
    setSheetOpen(true);
  };

  const openEditUserModal = (u: User) => {
    setUserToEdit(u);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* HEADER & ACTIONS (Matching Stitch) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Configuración Corporativa
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className="font-semibold text-brand">Directorio ITSM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gestión de Personal y Usuarios
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Administración de cuentas, perfiles de acceso y roles operativos del sistema ITSM.
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
                title: "Exportando directorio",
                description: "Generando archivo CSV con la lista de usuarios y roles...",
                type: "info",
              })
            }
            className="gap-2 text-xs font-semibold rounded-xl border-border bg-card shadow-xs"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Exportar Directorio</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={openNewUserModal}
            className="gap-2 text-xs font-semibold rounded-xl bg-brand hover:bg-brand-hover text-white shadow-xs"
          >
            <UserPlus className="size-4" />
            <span>+ Nuevo Usuario / Funcionario</span>
          </Button>
        </div>
      </div>

      {/* KPI METRICS GRID (4 Cards exact to Stitch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Usuarios */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Total Usuarios Activos</span>
            <div className="size-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {totalUsers}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-brand-soft text-brand-soft-fg font-semibold">
                <TrendingUp className="size-3" />
                <span>+6</span>
              </span>
              <span className="text-muted-foreground">incorporados este mes</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Técnicos L1/L2 */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Técnicos L1/L2</span>
            <div className="size-9 rounded-xl bg-muted text-foreground flex items-center justify-center">
              <Wrench className="size-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {techniciansCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand font-medium">
              <span className="size-2 rounded-full bg-brand animate-pulse" />
              <span>Disponibles para asignación</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Solicitantes Departamentales */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Solicitantes Departamentales</span>
            <div className="size-9 rounded-xl bg-muted text-foreground flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {requestorsCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Áreas de negocio registradas</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Administradores */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Administradores / Supervisores</span>
            <div className="size-9 rounded-xl bg-muted text-foreground flex items-center justify-center">
              <Shield className="size-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {adminsCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Control total de plataforma</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CARD WRAPPER */}
      <div className="bg-card rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
        {/* Role Navigation Tabs */}
        <div className="px-5 pt-3 bg-muted/40 border-b border-border flex flex-wrap items-center gap-1">
          {[
            { key: "all", label: "Todos", count: totalUsers },
            { key: "technician", label: "Técnicos de Soporte", count: techniciansCount },
            { key: "requestor", label: "Solicitantes", count: requestorsCount },
            { key: "admin", label: "Administradores", count: adminsCount },
            { key: "inactive", label: "Inactivos", count: inactiveCount },
          ].map((tab) => {
            const isActive = roleTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setRoleTab(tab.key);
                  setPage(1);
                }}
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

        {/* Search & Filters Toolbar with Refresh and Showing Counter */}
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border-b border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por nombre, correo, ID o cargo..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
            {/* Sede selector */}
            <select
              value={siteFilter}
              onChange={(e) => {
                setSiteFilter(e.target.value);
                setPage(1);
              }}
              className="bg-muted/60 text-foreground text-xs font-medium rounded-xl px-3 py-2 border border-border focus:ring-1 focus:ring-brand"
            >
              <option value="all">Sede: Todas</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>

            {/* Estado selector */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-muted/60 text-foreground text-xs font-medium rounded-xl px-3 py-2 border border-border focus:ring-1 focus:ring-brand"
            >
              <option value="all">Estado: Todos</option>
              <option value="active">Activo</option>
              <option value="busy">En Turno / Ocupado</option>
              <option value="inactive">Inactivo / Suspendido</option>
            </select>

            {/* Clear filters button */}
            <button
              type="button"
              onClick={handleClearFilters}
              title="Limpiar filtros"
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FilterX className="size-4" />
            </button>

            {/* Showing Counter & Refresh */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Mostrando{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {pagedUsers.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {users.length}
                </span>
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                aria-label="Refrescar directorio"
                title="Refrescar directorio"
              >
                <RefreshCw
                  className={cn("size-4", (refreshing || loading) && "animate-spin")}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-[11px] font-bold uppercase tracking-wider border-b border-border">
                <th className="py-3 px-5">Usuario &amp; Datos</th>
                <th className="py-3 px-4">Rol Preestablecido</th>
                <th className="py-3 px-4">Departamento &amp; Sede</th>
                <th className="py-3 px-4">Contacto &amp; Anexo</th>
                <th className="py-3 px-4">Carga / Estado</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="size-6 animate-spin text-brand" />
                      <span className="text-xs font-semibold">Cargando directorio de usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="size-6 text-muted-foreground" />
                      <span className="text-xs font-semibold">No se encontraron usuarios con los criterios indicados.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedUsers.map((user) => {
                const site = sitesById[user.siteId];
                const initials = user.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const isTechnician = user.role === "technician";
                const isAdmin = user.role === "admin" || user.role === "director";

                return (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    {/* Columna 1: Usuario & Datos */}
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div
                          className="size-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5 shadow-xs"
                          style={{ backgroundColor: user.color || "#006c46" }}
                        >
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground text-xs leading-snug hover:text-brand cursor-pointer">
                            {user.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                            {user.title || "Colaborador Institucional"}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-brand mt-0.5">
                            {user.employeeCode || `#EMP-940${user.id.slice(-2)}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Columna 2: Rol Preestablecido */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                            isAdmin
                              ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : isTechnician
                              ? "bg-brand-soft text-brand-soft-fg border border-brand/20"
                              : "bg-muted text-muted-foreground border border-border",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isAdmin
                                ? "bg-purple-500"
                                : isTechnician
                                ? "bg-brand"
                                : "bg-muted-foreground",
                            )}
                          />
                          <span>{ROLE_META[user.role]?.label || user.role}</span>
                        </span>

                        {/* Especialidades o Colas para técnicos */}
                        {isTechnician && user.queues && user.queues.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {user.queues.slice(0, 2).map((q) => (
                              <span
                                key={q}
                                className="px-1.5 py-0.2 rounded bg-muted text-foreground text-[10px] font-medium"
                              >
                                {q}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Columna 3: Departamento & Sede */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground text-xs">
                          {user.department || "TI & Infraestructura"}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <Building2 className="size-3 text-brand shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {site?.name || "Sede Central"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Columna 4: Contacto & Anexo */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Mail className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[190px]">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Phone className="size-3 text-muted-foreground shrink-0" />
                          <span>{user.phone}</span>
                          <span className="font-semibold text-brand">
                            ({user.extension || "Ext. 4010"})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Columna 5: Carga / Estado */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                            user.active
                              ? user.presence === "busy"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                : "bg-brand-soft text-brand-soft-fg"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              user.active
                                ? user.presence === "busy"
                                  ? "bg-amber-500"
                                  : "bg-brand animate-pulse"
                                : "bg-muted-foreground",
                            )}
                          />
                          <span>
                            {user.active
                              ? user.presence === "busy"
                                ? "En Turno / Ocupado"
                                : "Activo / En Línea"
                              : "Inactivo"}
                          </span>
                        </span>

                        <span className="text-[11px] text-muted-foreground">
                          {user.openTickets}{" "}
                          {user.openTickets === 1 ? "caso activo" : "casos activos"}
                        </span>
                      </div>
                    </td>

                    {/* Columna 6: Acciones */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground">
                        <button
                          type="button"
                          title={user.active ? "Desactivar usuario" : "Activar usuario"}
                          onClick={() => {
                            toggleActive(user.id);
                            toast.add({
                              title: user.active ? "Usuario suspendido" : "Usuario activado",
                              description: `${user.name} ahora está ${user.active ? "inactivo" : "activo"}.`,
                              type: "info",
                            });
                          }}
                          className="p-1.5 hover:text-brand hover:bg-muted rounded-lg transition-colors"
                        >
                          {user.active ? (
                            <ToggleRight className="size-4 text-brand" />
                          ) : (
                            <ToggleLeft className="size-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          title="Ver perfil"
                          onClick={() =>
                            toast.add({
                              title: user.name,
                              description: `${user.title || "Usuario"} • ${user.department || "Área General"}`,
                              type: "info",
                            })
                          }
                          className="p-1.5 hover:text-brand hover:bg-muted rounded-lg transition-colors"
                        >
                          <Eye className="size-4" />
                        </button>

                        <button
                          type="button"
                          title="Editar usuario"
                          onClick={() => openEditUserModal(user)}
                          className="p-1.5 hover:text-brand hover:bg-muted rounded-lg transition-colors"
                        >
                          <Edit className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination (matching Tickets and Sites pages) */}
        <TicketsTableFooter
          from={from}
          to={to}
          total={users.length}
          page={currentPage}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      {/* Drawer Panel CRUD for Creating/Editing User */}
      <UserFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        userToEdit={userToEdit}
      />
    </div>
  );
}