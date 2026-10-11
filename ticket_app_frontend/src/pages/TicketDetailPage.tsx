import { useMemo, useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  FileText,
  FolderOpen,
  MapPin,
  MessageSquare,
  Paperclip,
  Send,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { SlaTimer } from "@/components/common/SlaTimer";
import { EmptyState } from "@/components/common/EmptyState";
import { TicketStatusSelect } from "@/features/tickets/components/TicketStatusSelect";
import { AssignMenu } from "@/features/tickets/components/AssignMenu";
import { ActivityFeed } from "@/features/tickets/components/ActivityFeed";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { useAuth } from "@/context/auth-context";
import { formatDate, formatDateTime, formatTicketId } from "@/utils";
import type { TicketStatus } from "@/types";

const RESOLUTION_COLORS: Partial<Record<TicketStatus, string>> = {
  resolved: "border-status-resolved-border bg-status-resolved-bg text-status-resolved-fg",
  cancelled: "border-status-cancelled-border bg-status-cancelled-bg text-status-cancelled-fg",
};

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const ticket = useTicketStore((state) => state.items.find((t) => t.id === id));
  const updateStatus = useTicketStore((state) => state.updateStatus);
  const assignTicket = useTicketStore((state) => state.assignTicket);
  const addNote = useTicketStore((state) => state.addNote);

  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );
  const sitesById = useMemo(
    () => Object.fromEntries(sites.map((s) => [s.id, s])),
    [sites],
  );

  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const [resolution, setResolution] = useState("");
  const [note, setNote] = useState("");
  const [notePublic, setNotePublic] = useState(false);

  useEffect(() => {
    if (!ticket) navigate("/tickets", { replace: true });
  }, [ticket, navigate]);

  if (!ticket) {
    return null;
  }

  const requestor = usersById[ticket.requestorId];
  const assignee = ticket.assigneeId ? usersById[ticket.assigneeId] : undefined;
  const site = sitesById[ticket.siteId];
  const technicians = users.filter((u) => u.role === "technician" && u.active);

  const handleStatusRequest = (nextStatus: TicketStatus) => {
    if (nextStatus === ticket.status) return;
    if (nextStatus === "resolved" || nextStatus === "cancelled") {
      setResolution("");
      setPendingStatus(nextStatus);
      return;
    }
    updateStatus(ticket.id, nextStatus, user?.id ?? "system");
    toast.add({
      title: "Estado actualizado",
      description: `La solicitud ahora está en "${nextStatus}".`,
      type: "success",
    });
  };

  const confirmFinalStatus = () => {
    if (!pendingStatus || !user) return;
    updateStatus(ticket.id, pendingStatus, user.id, resolution.trim() || undefined);
    toast.add({
      title: pendingStatus === "resolved" ? "Solicitud resuelta" : "Solicitud cancelada",
      description: "El estado de la solicitud fue actualizado.",
      type: "success",
    });
    setPendingStatus(null);
  };

  const handleAssign = (assigneeId: string) => {
    assignTicket(ticket.id, assigneeId, user?.id ?? "system");
    toast.add({
      title: "Asignación actualizada",
      description: "La solicitud fue asignada al técnico seleccionado.",
      type: "success",
    });
  };

  const submitNote = (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim() || !user) return;
    addNote(ticket.id, user.id, note.trim(), notePublic);
    setNote("");
    setNotePublic(false);
    toast.add({
      title: notePublic ? "Respuesta publicada" : "Nota registrada",
      description: notePublic
        ? "El solicitante ya puede verla."
        : "Solo el equipo técnico puede verla.",
      type: "success",
    });
  };

  const resolutionTokens = ticket.resolution
    ? RESOLUTION_COLORS[ticket.status]
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        badge={
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-brand-soft-fg hover:underline"
          >
            <ArrowLeft className="size-3" />
            {formatTicketId(ticket.sequence)}
          </Link>
        }
        description={`${formatDateTime(ticket.createdAt)} · ${site?.name ?? "Sede no registrada"} · ${ticket.area}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AssignMenu
              assignee={assignee}
              technicians={technicians}
              onAssign={handleAssign}
            />
            <TicketStatusSelect
              value={ticket.status}
              onValueChange={handleStatusRequest}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4 text-brand" />
                Prioridad y SLA
              </CardTitle>
              <SlaTimer dueAt={ticket.slaDueAt} className="text-sm" />
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              <Badge variant="outline">{ticket.category}</Badge>
              <Badge variant="outline">{ticket.subcategory}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-brand" />
                Descripción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="size-4 text-brand" />
                Historial de actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.activities.length > 0 ? (
                <ActivityFeed activities={ticket.activities} usersById={usersById} />
              ) : (
                <EmptyState title="Sin actividad registrada" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="size-4 text-brand" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {requestor ? (
                  <UserAvatar name={requestor.name} color={requestor.color} size="md" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="size-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {requestor?.name ?? "Solicitante"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {requestor?.email ?? "—"}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 border-t border-border pt-4">
                {[
                  { icon: Building2, label: "Sede", value: site?.name ?? "—" },
                  { icon: MapPin, label: "Área", value: ticket.area },
                  { icon: UserRound, label: "Asignado a", value: assignee?.name ?? "Sin asignar" },
                  { icon: CalendarClock, label: "Creada", value: formatDate(ticket.createdAt) },
                  { icon: CalendarClock, label: "Actualizada", value: formatDate(ticket.updatedAt) },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{row.label}</dt>
                        <dd className="text-sm font-medium text-foreground">{row.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>

          {ticket.resolution && resolutionTokens ? (
            <Card className={resolutionTokens}>
              <CardHeader>
                <CardTitle className="text-base">
                  {ticket.status === "resolved" ? "Solución aplicada" : "Motivo de cancelación"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{ticket.resolution}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="size-4 text-brand" />
                Adjuntos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.attachments.length > 0 ? (
                <ul className="space-y-2">
                  {ticket.attachments.map((file) => (
                    <li key={file.id} className="flex items-center gap-2 text-sm">
                      <FileText className="size-4 text-muted-foreground" />
                      {file.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sin adjuntos.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="size-4 text-brand" />
                Comunicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitNote} className="space-y-3">
                <Label htmlFor="note" className="sr-only">
                  Nota o respuesta
                </Label>
                <Textarea
                  id="note"
                  rows={4}
                  placeholder="Escribe una nota interna o una respuesta para el solicitante…"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={notePublic}
                      onCheckedChange={setNotePublic}
                      aria-label="Visible para el solicitante"
                    />
                    Visible para el solicitante
                  </span>
                  <Button type="submit" size="sm" disabled={!note.trim()} className="gap-1.5">
                    <Send className="size-3.5" />
                    Enviar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={pendingStatus !== null} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === "resolved" ? "Resolver solicitud" : "Cancelar solicitud"}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus === "resolved"
                ? "Describe la solución aplicada para que el solicitante pueda confirmarla."
                : "Indica el motivo por el que se cancela la solicitud."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={4}
            placeholder="Escribe la información aquí…"
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmFinalStatus}>
              {pendingStatus === "resolved" ? "Marcar como resuelta" : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}