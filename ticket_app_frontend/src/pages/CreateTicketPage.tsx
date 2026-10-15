import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";
import { TicketForm } from "@/features/tickets/components/TicketForm";

export function CreateTicketPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb & Page Header exact to Stitch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link
              to="/tickets"
              className="hover:text-brand transition-colors flex items-center gap-1.5"
            >
              <Ticket className="size-3.5" />
              <span>Solicitudes</span>
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-brand font-semibold">Nueva Solicitud</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Crear Solicitud de Servicio
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Completa los datos del requerimiento para clasificarlo y enrutarlo al equipo especialista correspondiente según la criticidad informada.
          </p>
        </div>
      </div>

      {/* Main Stitch Layout */}
      <TicketForm />
    </div>
  );
}