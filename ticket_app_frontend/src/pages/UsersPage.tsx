import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { FilterPills } from "@/components/common/FilterPills";
import { UsersTable } from "@/features/users/components/UsersTable";
import { UserFormSheet } from "@/features/users/components/UserFormSheet";
import { useSiteStore, useUserStore } from "@/store";
import { ROLES, ROLE_META } from "@/utils";
import type { Role } from "@/types";

export function UsersPage() {
  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);
  const toggleActive = useUserStore((state) => state.toggleActive);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const sitesById = useMemo(
    () => Object.fromEntries(sites.map((s) => [s.id, s])),
    [sites],
  );

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return users
      .filter((user) => {
        if (role !== "all" && user.role !== role) return false;
        if (!normalized) return true;
        return `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(normalized);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, search, role]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Personal y Usuarios"
        description="Administra el equipo y los roles de cada colaborador de la institución."
        actions={
          <Button className="gap-1.5" onClick={() => setSheetOpen(true)}>
            <UserPlus className="size-4" />
            Nuevo Usuario
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, correo o teléfono…"
            className="w-full sm:w-80"
            label="Buscar usuarios"
          />
          <FilterPills
            ariaLabel="Filtrar por rol"
            options={[
              { value: "all", label: "Todos" },
              ...ROLES.map((value) => ({ value, label: ROLE_META[value].label })),
            ]}
            value={role}
            onValueChange={(value) => setRole(value as Role | "all")}
          />
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <UsersTable users={filtered} sitesById={sitesById} onToggleActive={toggleActive} />
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              title="No se encontraron usuarios"
              description="Ajusta la búsqueda o los filtros aplicados."
            />
          </CardContent>
        </Card>
      )}

      <UserFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}