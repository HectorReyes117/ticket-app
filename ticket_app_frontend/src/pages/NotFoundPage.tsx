import { Link } from "react-router-dom";
import { ArrowLeft, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <TicketIcon className="size-8" />
      </span>
      <p className="font-mono text-sm font-semibold tabular-nums text-brand-soft-fg">
        ERROR 404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Página no encontrada
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La página que buscas no existe o fue movida a otra ubicación.
      </p>
      <Button render={<Link to="/dashboard" />} className="mt-2 gap-1.5">
        <ArrowLeft className="size-4" />
        Regresar al inicio
      </Button>
    </div>
  );
}