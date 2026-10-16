import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  History,
  Hourglass,
  Loader2,
  Lock,
  Mail,
  Paperclip,
  Phone,
  Send,
  Server,
  Upload,
  User,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { useAuth } from "@/context/auth-context";
import { formatDateTime, formatRelativeTime, PRIORITY_META, cn } from "@/utils";
import type { TicketStatus } from "@/types";
import { uploadTicketAttachment } from "@/features/tickets/services/ticketService";
import { UserAvatar } from "@/components/common/UserAvatar";

const STEPS_FLOW: Array<{
  key: string;
  label: string;
  sub: string;
  icon: typeof Check;
}> = [
  { key: "pending", label: "1. Pendiente", sub: "Apertura", icon: Check },
  { key: "diagnostico", label: "2. Diagnóstico", sub: "Evaluación", icon: Check },
  { key: "in_progress", label: "3. En Proceso", sub: "Trabajo activo", icon: Wrench },
  { key: "on_hold", label: "4. En Espera", sub: "Repuesto/Terceros", icon: Hourglass },
  { key: "resolved", label: "5. Resuelto", sub: "Cierre técnico", icon: CheckCircle2 },
];

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
  const [noteText, setNoteText] = useState("");
  const [isPublicNote, setIsPublicNote] = useState(false);
  const [selectedStatusForm, setSelectedStatusForm] = useState<TicketStatus>("in_progress");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);

  const fetchTicketDetails = useTicketStore((state) => state.fetchTicketDetails);

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setIsUploadingAttachment(true);
      await uploadTicketAttachment(id, file);
      toast.add({
        title: "Archivo adjuntado",
        description: `Se adjuntó ${file.name} a la solicitud.`,
        type: "success",
      });
      await fetchTicketDetails(id);
    } catch (err: any) {
      toast.add({
        title: "Error al adjuntar archivo",
        description: err.message || "No se pudo subir el archivo.",
        type: "danger",
      });
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentFileInputRef.current) {
        attachmentFileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicketDetails(id).catch(() => {
        // Ticket not found
        navigate("/tickets", { replace: true });
      });
    }
  }, [id, fetchTicketDetails, navigate]);

  useEffect(() => {
    if (ticket) {
      setSelectedStatusForm(ticket.status);
    }
  }, [ticket]);

  if (!ticket) {
    return null;
  }

  const requestor = usersById[ticket.requestorId];
  const assignee = ticket.assigneeId ? usersById[ticket.assigneeId] : undefined;
  const site = sitesById[ticket.siteId];
  const technicians = users.filter((u) => u.role === "technician" && u.active);

  // Status index for resolution stepper
  const currentStepIndex = (() => {
    if (ticket.status === "pending") return 0;
    if (ticket.status === "in_progress") return 2;
    if (ticket.status === "on_hold") return 3;
    if (ticket.status === "resolved") return 4;
    return 1;
  })();


  const confirmFinalStatus = () => {
    if (!pendingStatus || !user) return;
    updateStatus(ticket.id, pendingStatus, user.id, resolution.trim() || undefined);
    toast.add({
      title: pendingStatus === "resolved" ? "Solicitud resuelta" : "Solicitud cancelada",
      description: "El estado de la solicitud fue actualizado exitosamente.",
      type: "success",
    });
    setPendingStatus(null);
  };

  const handleAssign = (newAssigneeId: string) => {
    assignTicket(ticket.id, newAssigneeId, user?.id ?? "system");
    setShowAssignModal(false);
    toast.add({
      title: "Asignación actualizada",
      description: "El especialista responsable fue reasignado.",
      type: "success",
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatusForm !== ticket.status) {
      if (selectedStatusForm === "resolved" || selectedStatusForm === "cancelled") {
        setPendingStatus(selectedStatusForm);
        return;
      }
      updateStatus(ticket.id, selectedStatusForm, user?.id ?? "usr-1", noteText.trim() || undefined);
    }
    if (noteText.trim()) {
      addNote(ticket.id, user?.id ?? "usr-1", noteText.trim(), isPublicNote);
    }
    toast.add({
      title: "Actualización registrada",
      description: "Se guardaron los cambios del ticket.",
      type: "success",
    });
    setNoteText("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb & Quick Info Bar (Print removed as requested) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground flex-wrap">
          <Link
            to="/tickets"
            className="hover:text-brand transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            <span>Solicitudes</span>
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="font-bold text-brand">#{ticket.id}</span>
          <span className="size-1.5 rounded-full bg-border" />
          <span className="flex items-center gap-1 text-muted-foreground font-normal">
            <Clock className="size-3" />
            Apertura: {formatDateTime(ticket.createdAt)}
          </span>
        </div>

        {/* Action Buttons: Print removed; keeping Reasignar and Cerrar Ticket */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAssignModal(true)}
            className="gap-2 text-xs font-medium rounded-xl border-border bg-card shadow-xs"
          >
            <ArrowLeftRight className="size-4 text-muted-foreground" />
            <span>Reasignar</span>
          </Button>

          {ticket.status !== "resolved" && ticket.status !== "cancelled" ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setResolution("");
                setPendingStatus("resolved");
              }}
              className="gap-2 text-xs font-semibold rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 shadow-xs"
            >
              <CheckCircle2 className="size-4 text-destructive" />
              <span>Cerrar Ticket</span>
            </Button>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-xl bg-muted text-muted-foreground font-semibold">
              Ticket Concluido
            </span>
          )}
        </div>
      </div>

      {/* Title & Status Header Card */}
      <div className="bg-card rounded-2xl p-6 shadow-xs border border-border flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-destructive" />
                Prioridad {PRIORITY_META[ticket.priority].label}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
                <Server className="size-3.5" />
                {ticket.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {ticket.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Estado Actual
            </span>
            <div className="px-3.5 py-1.5 rounded-full bg-brand-soft text-brand-soft-fg text-xs font-bold flex items-center gap-2 shadow-xs">
              <span className="size-2 rounded-full bg-brand animate-pulse" />
              <span className="capitalize">{ticket.status.replace("_", " ")}</span>
            </div>
          </div>
        </div>

        {/* Resolution Stepper exact to Stitch */}
        <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {STEPS_FLOW.map((s, idx) => {
              const IconComp = s.icon;
              const isPassed = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={s.key}
                  className={cn(
                    "flex items-center gap-3 transition-opacity",
                    !isPassed && !isCurrent && "opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all",
                      isPassed && "bg-brand text-white",
                      isCurrent && "bg-brand text-white ring-4 ring-brand-soft shadow-xs",
                      !isPassed && !isCurrent && "bg-muted text-muted-foreground border border-border",
                    )}
                  >
                    <IconComp className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        "text-xs truncate font-semibold",
                        isCurrent ? "text-brand" : "text-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {isCurrent ? "Activo ahora" : s.sub}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Grid (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (65% -> 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card 1: Requirement Details */}
          <div className="bg-card rounded-2xl p-6 shadow-xs border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-brand" />
                <h2 className="text-base font-semibold text-foreground">
                  Detalles del Requerimiento
                </h2>
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-mono">
                ID Único: #{ticket.id}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {ticket.description}
            </p>

            {/* Structured Key-Value Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-muted/60 rounded-xl flex flex-col gap-1 border border-border/40">
                <span className="text-[11px] text-muted-foreground">Sede & Ubicación</span>
                <span className="text-xs font-semibold text-foreground truncate">
                  {site?.name ?? "Sede Central"} - {ticket.area}
                </span>
              </div>
              <div className="p-3 bg-muted/60 rounded-xl flex flex-col gap-1 border border-border/40">
                <span className="text-[11px] text-muted-foreground">Subcategoría</span>
                <span className="text-xs font-semibold text-foreground truncate">
                  {ticket.subcategory}
                </span>
              </div>
              <div className="p-3 bg-muted/60 rounded-xl flex flex-col gap-1 border border-border/40">
                <span className="text-[11px] text-muted-foreground">Tiempo Transcurrido</span>
                <span className="text-xs font-semibold text-brand truncate">
                  {formatRelativeTime(ticket.createdAt)}
                </span>
              </div>
              <div className="p-3 bg-muted/60 rounded-xl flex flex-col gap-1 border border-border/40">
                <span className="text-[11px] text-muted-foreground">Impacto Operativo</span>
                <span
                  className={cn(
                    "text-xs font-semibold truncate",
                    ticket.priority === "critical" || ticket.priority === "high"
                      ? "text-destructive"
                      : "text-foreground",
                  )}
                >
                  {ticket.priority === "critical"
                    ? "Crítico (Global)"
                    : ticket.priority === "high"
                      ? "Alto (Departamento)"
                      : "Estándar"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Update Status & Add Note */}
          <div className="bg-card rounded-2xl p-6 shadow-xs border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="size-5 text-brand" />
                <h2 className="text-base font-semibold text-foreground">
                  Actualizar Estado y Agregar Observación
                </h2>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand animate-pulse" />
                Sincronización en vivo
              </span>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select New Status */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="nuevo-estado" className="text-xs font-semibold text-foreground">
                    Cambiar Estado
                  </label>
                  <select
                    id="nuevo-estado"
                    value={selectedStatusForm}
                    onChange={(e) => setSelectedStatusForm(e.target.value as TicketStatus)}
                    className="w-full bg-muted/60 text-foreground text-xs font-medium rounded-xl px-3.5 py-2.5 border border-border focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="in_progress">En Proceso (Trabajando en sitio)</option>
                    <option value="on_hold">En Espera de Repuesto / Proveedor</option>
                    <option value="pending">Retornar a Pendiente</option>
                    <option value="resolved">Marcar como Resuelto</option>
                    <option value="cancelled">Cancelar Ticket</option>
                  </select>
                </div>

                {/* Note Visibility Toggle */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Visibilidad del Mensaje</span>
                  <div className="flex p-1 bg-muted rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsPublicNote(false)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                        !isPublicNote
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Lock className="size-3.5 text-muted-foreground" />
                      Nota Interna
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublicNote(true)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                        isPublicNote
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Mail className="size-3.5 text-brand" />
                      Para Solicitante
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Textarea */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nota-observacion" className="text-xs font-semibold text-foreground">
                  Bitácora de Intervención / Respuesta
                </label>
                <Textarea
                  id="nota-observacion"
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={
                    isPublicNote
                      ? `Escribe un mensaje explicativo para ${requestor?.name ?? "el solicitante"}...`
                      : "Escribe el avance técnico o diagnóstico visible únicamente para técnicos..."
                  }
                  className="w-full bg-muted/50 text-foreground text-xs rounded-xl p-3 placeholder:text-muted-foreground border-border focus-visible:ring-brand resize-none"
                />
              </div>

              {/* Submit Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="size-4 rounded text-brand focus:ring-brand accent-brand"
                  />
                  <span className="text-xs text-muted-foreground">
                    Notificar por correo electrónico al solicitante
                  </span>
                </label>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl px-5 py-2.5 shadow-xs w-full sm:w-auto"
                >
                  <Send className="size-3.5" />
                  <span>Guardar y Actualizar</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Card 3: Chronological History & Traceability */}
          <div className="bg-card rounded-2xl p-6 shadow-xs border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="size-5 text-brand" />
                <h2 className="text-base font-semibold text-foreground">
                  Historial y Trazabilidad
                </h2>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {ticket.activities.length} registros
              </span>
            </div>

            <div className="flex flex-col relative pl-6 gap-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {ticket.activities && ticket.activities.length > 0 ? (
                ticket.activities.map((act) => {
                  const author = usersById[act.authorId];
                  return (
                    <div key={act.id} className="relative flex flex-col gap-1.5">
                      <span className="absolute -left-[27px] top-1 size-4 rounded-full bg-brand ring-4 ring-card" />
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs font-semibold text-foreground">
                          {act.public ? "Respuesta Pública" : "Registro de Actividad"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(act.createdAt)}
                        </span>
                      </div>
                      <span className="text-[11px] text-brand font-medium">
                        {author?.name ?? "Especialista"} • {author?.role ?? "Soporte"}
                      </span>
                      <div className="p-3 bg-muted/60 rounded-xl text-xs text-foreground mt-1 border border-border/40">
                        {act.message}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="relative flex flex-col gap-1.5">
                  <span className="absolute -left-[27px] top-1 size-4 rounded-full bg-brand ring-4 ring-card" />
                  <span className="text-xs font-semibold text-foreground">Apertura de Solicitud de Servicio</span>
                  <span className="text-[11px] text-muted-foreground">{formatRelativeTime(ticket.createdAt)}</span>
                  <div className="p-3 bg-muted/60 rounded-xl text-xs text-foreground mt-1 border border-border/40">
                    {ticket.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (35% -> 4 cols) Context Panels */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Panel 1: Assigned Technician */}
          <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Especialista Responsable
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-soft-fg text-[11px] font-bold">
                {assignee ? "Asignado" : "Pendiente"}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <UserAvatar
                name={assignee?.name ?? "Sin asignar"}
                avatarUrl={assignee?.avatarUrl}
                color={assignee?.color || "#2563eb"}
                presence={assignee?.presence}
                size="lg"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate">
                  {assignee?.name ?? "Sin técnico asignado"}
                </span>
                <span className="text-xs text-brand font-semibold truncate">
                  {assignee?.role ? `Rol: ${assignee.role}` : "Por definir"}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {assignee?.email ?? "Disponible para asignación"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-border">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" /> Contacto
                </span>
                <span className="text-foreground font-medium">+1 809 555-0199</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAssignModal(true)}
              className="w-full text-xs font-medium rounded-xl gap-2 border-border bg-card hover:bg-muted"
            >
              <ArrowLeftRight className="size-4 text-muted-foreground" />
              <span>Reasignar a otro técnico</span>
            </Button>
          </div>

          {/* Panel 2: Applicant Information (Mensaje y Ver Historial eliminados según instrucciones) */}
          <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Datos del Solicitante
              </span>
              <User className="size-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar
                name={requestor?.name ?? "Usuario Solicitante"}
                avatarUrl={requestor?.avatarUrl}
                color={requestor?.color || "#64748b"}
                presence={requestor?.presence}
                size="md"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">
                  {requestor?.name ?? "Usuario Solicitante"}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {requestor?.role ?? "Solicitante Institucional"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 bg-muted/60 rounded-xl p-3 border border-border/40 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sede:</span>
                <span className="text-foreground font-semibold truncate">
                  {site?.name ?? "Sede Central"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Área:</span>
                <span className="text-foreground font-semibold">{ticket.area}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Correo:</span>
                <span className="text-brand font-semibold truncate max-w-[150px]">
                  {requestor?.email ?? "solicitante@unicaribe.edu.do"}
                </span>
              </div>
            </div>
          </div>

          {/* Panel 3: SLA & Time Tracker with Donut Visual */}
          <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tiempo de Atención
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-soft-fg text-[11px] font-bold">
                En Plazo Óptimo
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative size-20 shrink-0">
                <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-brand stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray="72, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground">72%</span>
                </div>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  {formatRelativeTime(ticket.createdAt)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Tiempo transcurrido desde apertura
                </span>
                <span className="text-[11px] text-brand font-medium mt-0.5">
                  Límite SLA: {formatDateTime(ticket.slaDueAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Panel 4: Attachments and Files */}
          <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col gap-3">
            <input
              type="file"
              ref={attachmentFileInputRef}
              onChange={handleUploadAttachment}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Archivos & Evidencias ({ticket.attachments.length})
              </span>
              <button
                type="button"
                disabled={isUploadingAttachment}
                onClick={() => attachmentFileInputRef.current?.click()}
                className="text-brand text-xs font-bold hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {isUploadingAttachment ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-3" />
                    <span>Subir</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {ticket.attachments.length > 0 ? (
                ticket.attachments.map((file) => {
                  const isImage = file.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
                  const sizeFormatted = file.size
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Archivo adjunto";
                  const downloadUrl = file.fileUrl
                    ? file.fileUrl.startsWith("http")
                      ? file.fileUrl
                      : `http://localhost:5214${file.fileUrl}`
                    : undefined;

                  return (
                    <div
                      key={file.id}
                      className="p-2.5 bg-muted/60 rounded-xl flex items-center justify-between border border-border/40 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-lg bg-card text-brand flex items-center justify-center shrink-0 border border-border">
                          {isImage ? <Paperclip className="size-4" /> : <FileText className="size-4" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {sizeFormatted} • {formatRelativeTime(file.uploadedAt)}
                          </span>
                        </div>
                      </div>
                      {downloadUrl ? (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={file.name}
                          title="Descargar archivo"
                          className="p-1.5 text-muted-foreground hover:text-brand transition-colors rounded-lg hover:bg-card"
                        >
                          <Download className="size-4" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            toast.add({
                              title: "Archivo adjunto",
                              description: file.name,
                              type: "info",
                            })
                          }
                          className="p-1.5 text-muted-foreground hover:text-brand transition-colors rounded-lg hover:bg-card"
                        >
                          <Download className="size-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-muted/30 rounded-xl text-center border border-dashed border-border/60">
                  <p className="text-xs text-muted-foreground">No hay evidencias o archivos adjuntos en esta solicitud.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Reasignar Técnico */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reasignar Especialista</DialogTitle>
            <DialogDescription>
              Selecciona el técnico que atenderá la solicitud #{ticket.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {technicians.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleAssign(t.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                  ticket.assigneeId === t.id
                    ? "border-brand bg-brand-soft/60"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center text-xs">
                    {t.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{t.name}</span>
                    <span className="text-[11px] text-muted-foreground">{t.email}</span>
                  </div>
                </div>
                {ticket.assigneeId === t.id && (
                  <span className="text-xs font-bold text-brand">Actual</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Resolver / Cancelar */}
      <Dialog open={pendingStatus !== null} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === "resolved" ? "Resolver Solicitud" : "Cancelar Solicitud"}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus === "resolved"
                ? "Describe la solución aplicada para que conste en la bitácora."
                : "Indica el motivo por el cual se concluye la solicitud."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={4}
            placeholder="Escribe el resumen técnico de cierre..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="text-xs"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPendingStatus(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={confirmFinalStatus}
              className="bg-brand text-white hover:bg-brand-hover"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}