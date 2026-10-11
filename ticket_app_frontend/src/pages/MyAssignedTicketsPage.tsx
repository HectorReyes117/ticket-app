import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { TicketsBrowser } from "@/features/tickets/components/TicketsBrowser";
import { useAuth } from "@/context/auth-context";
import { useTicketStore } from "@/store";
import { ClipboardList } from "lucide-react";

export function MyAssignedTicketsPage() {
  const { user } = useAuth();
  const tickets = useTicketStore((state) => state.items);

  const myTickets = user
    ? tickets.filter((t) => t.assigneeId === user.id)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Solicitudes Asignadas"
        description="Las solicitudes que tienes asignadas para resolver en este momento."
        badge={
          <Badge variant="secondary" className="gap-1.5">
            <ClipboardList className="size-3.5" />
            {myTickets.length}{" "}
            {myTickets.length === 1 ? "solicitud asignada" : "solicitudes asignadas"}
          </Badge>
        }
      />
      {myTickets.length > 0 ? (
        <TicketsBrowser tickets={myTickets} />
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={<ClipboardList className="size-6" />}
              title="No tienes solicitudes asignadas"
              description="Cuando un administrador te asigne una solicitud, aparecerá aquí."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}