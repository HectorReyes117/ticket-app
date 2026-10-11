import { PageHeader } from "@/components/common/PageHeader";
import { TicketsBrowser } from "@/features/tickets/components/TicketsBrowser";
import { useTicketStore } from "@/store";

export function TicketsPage() {
  const tickets = useTicketStore((state) => state.items);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Todas las Solicitudes"
        description="Consulta el estado de cada solicitud de servicio de la institución."
      />
      <TicketsBrowser tickets={tickets} />
    </div>
  );
}