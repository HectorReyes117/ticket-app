import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { SitesGrid } from "@/features/sites/components/SitesGrid";
import { SiteFormSheet } from "@/features/sites/components/SiteFormSheet";
import { useSiteStore, useUserStore } from "@/store";

export function SitesPage() {
  const sites = useSiteStore((state) => state.items);
  const users = useUserStore((state) => state.items);
  const [sheetOpen, setSheetOpen] = useState(false);

  const managersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sedes y Ubicaciones Físicas"
        description="Consulta las sedes de la institución y las áreas atendidas por el equipo de soporte."
        actions={
          <Button className="gap-1.5" onClick={() => setSheetOpen(true)}>
            <Building2 className="size-4" />
            Nueva Sede
          </Button>
        }
      />
      <SitesGrid sites={sites} managersById={managersById} />
      <SiteFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}