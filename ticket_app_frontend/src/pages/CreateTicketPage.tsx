import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { TicketForm } from "@/features/tickets/components/TicketForm";

export function CreateTicketPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crear Solicitud de Servicio"
        description="Describe el problema y el equipo de soporte lo atenderá lo antes posible."
        actions={
          <Button variant="ghost" className="gap-1.5" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
        }
      />
      <TicketForm />
    </div>
  );
}