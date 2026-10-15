import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlarmClock,
  ArrowUpDown,
  Building,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  Inbox,
  MapPin,
  MessageSquarePlus,
  PlayCircle,
  Plus,
  Send,
  Sparkles,
  StickyNote,
  Timer,
  TrendingUp,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { TicketStatusSelect } from "@/features/tickets/components/TicketStatusSelect";
import { useAuth } from "@/context/auth-context";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { PRIORITY_META, cn, formatRelativeTime } from "@/utils";
import type { Ticket } from "@/types";

export function MyAssignedTicketsPage() {
  const { user } = useAuth();
  const allTickets = useTicketStore((state) => state.items);
  const updateStatus = useTicketStore((state) => state.updateStatus);
  const addNote = useTicketStore((state) => state.addNote);
  const sites = useSiteStore((state) => state.items);
  const users = useUserStore((state) => state.items);

  // Modal states
  const [selectedTicketForNote, setSelectedTicketForNote] = useState<Ticket | null>(null);
  const [noteMessage, setNoteMessage] = useState("");
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursTicketId, setHoursTicketId] = useState("");
  const [loggedHours, setLoggedHours] = useState("1.5");
  const [hoursDescription, setHoursDescription] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "priority">("recent");

  // Filter assigned tickets strictly for active user
  const assignedTickets = useMemo(() => {
    if (!user) return [];
    return allTickets.filter(
      (t) => t.assigneeId === user.id || (user.employeeCode && t.assigneeId === user.employeeCode),
    );
  }, [allTickets, user]);

  const sortedTickets = useMemo(() => {
    return [...assignedTickets].sort((a, b) => {
      if (sortBy === "priority") {
        return PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [assignedTickets, sortBy]);

  // KPIs calculados sobre data 100% real
  const highPriorityCount = assignedTickets.filter(
    (t) => t.priority === "high" || t.priority === "critical",
  ).length;
  const inProgressCount = assignedTickets.filter(
    (t) => t.status === "in_progress",
  ).length;
  const resolvedCount = assignedTickets.filter((t) => t.status === "resolved").length;
  const totalAssigned = assignedTickets.length;
  const effectivenessRate = totalAssigned > 0 ? Math.round((resolvedCount / totalAssigned) * 100) : 100;

  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForNote || !noteMessage.trim()) return;
    addNote(
      selectedTicketForNote.id,
      user?.id ?? "usr-1",
      noteMessage.trim(),
      true,
    );
    toast.add({
      title: "Observación añadida",
      description: `Se registró en el ticket #${selectedTicketForNote.id}.`,
      type: "success",
    });
    setNoteMessage("");
    setSelectedTicketForNote(null);
  };

  const handleRegisterHours = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoursTicketId) {
      toast.add({
        title: "Selecciona un ticket",
        description: "Elige la solicitud a la que imputar las horas.",
        type: "error",
      });
      return;
    }
    addNote(
      hoursTicketId,
      user?.id ?? "usr-1",
      `[Registro de Horas] ${loggedHours} horas dedicadas: ${hoursDescription || "Labores de diagnóstico y soporte técnico."}`,
      false,
    );
    toast.add({
      title: "Horas registradas",
      description: `Se imputaron ${loggedHours} horas a la solicitud #${hoursTicketId}.`,
      type: "success",
    });
    setShowHoursModal(false);
    setHoursDescription("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Top View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Mis Solicitudes Asignadas
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-soft-fg text-xs font-semibold">
              <span className="size-2 rounded-full bg-brand animate-pulse" />
              <span className="uppercase tracking-wider">Turno Activo</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestión y resolución de tickets operativos asignados directamente a tu guardia.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="size-4" />
            <span>Nueva Solicitud</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards Grid (4 columns exactly matching Stitch) */}
      <section aria-label="Métricas Principales" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tickets Asignados */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Tickets Asignados</span>
            <Inbox className="size-5 text-brand" />
          </div>
          <div className="my-2.5">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {assignedTickets.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand font-medium">
            <TrendingUp className="size-3.5" />
            <span>+{assignedTickets.length} en guardia</span>
            <span className="text-muted-foreground ml-auto font-normal">en tu cola</span>
          </div>
        </div>

        {/* KPI 2: Alta Prioridad */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Alta Prioridad</span>
            <AlarmClock className="size-5 text-destructive" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {highPriorityCount}
            </span>
            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
              Crítico
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 text-destructive" />
            <span>Atención requerida hoy</span>
          </div>
        </div>

        {/* KPI 3: En Diagnóstico */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">En Diagnóstico</span>
            <PlayCircle className="size-5 text-muted-foreground" />
          </div>
          <div className="my-2.5">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {inProgressCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brand" />
            <span>En ejecución activa</span>
            <span className="text-muted-foreground ml-auto font-normal">
              {assignedTickets.length ? Math.round((inProgressCount / assignedTickets.length) * 100) : 0}% carga
            </span>
          </div>
        </div>

        {/* KPI 4: Efectividad */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Efectividad</span>
            <CheckCircle2 className="size-5 text-brand" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {effectivenessRate}%
            </span>
            <span className="text-xs font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full">
              {totalAssigned > 0 ? `${resolvedCount}/${totalAssigned}` : "Al día"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>Resolución de tus casos ({resolvedCount} concluidos)</span>
          </div>
        </div>
      </section>

      {/* Main Content Split Grid (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Ticket Stream (8 cols ~ 66%) */}
        <section aria-label="Listado de Tickets" className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">Cola Operativa</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {highPriorityCount} Críticos / Urgentes
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>Ordenar por:</span>
              <button
                type="button"
                onClick={() => setSortBy((prev) => (prev === "recent" ? "priority" : "recent"))}
                className="font-semibold text-brand flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>{sortBy === "recent" ? "Más Recientes" : "Mayor Prioridad"}</span>
                <ArrowUpDown className="size-3" />
              </button>
            </div>
          </div>

          {/* Ticket Cards Stream */}
          {sortedTickets.length === 0 ? (
            <div className="bg-card p-12 rounded-xl border border-border shadow-xs text-center flex flex-col items-center justify-center gap-3">
              <div className="size-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center">
                <Inbox className="size-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-sm font-bold text-foreground">No tienes tickets asignados</span>
                <p className="text-xs text-muted-foreground">
                  Actualmente no tienes solicitudes en tu guardia o cola operativa.
                </p>
              </div>
            </div>
          ) : (
            sortedTickets.map((ticket) => {
              const requestor = users.find((u) => u.id === ticket.requestorId);
            const site = sites.find((s) => s.id === ticket.siteId);
            const latestActivity = ticket.activities && ticket.activities.length > 0
              ? ticket.activities[ticket.activities.length - 1]
              : null;
            const latestAuthor = latestActivity ? users.find((u) => u.id === latestActivity.authorId) : null;

            return (
              <article
                key={ticket.id}
                className="bg-card p-6 rounded-xl border border-border shadow-xs hover:shadow-md transition-all flex flex-col gap-4"
              >
                {/* Card Header Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-lg">
                      #{ticket.id}
                    </span>

                    {/* Priority badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                        ticket.priority === "critical" || ticket.priority === "high"
                          ? "bg-destructive/10 text-destructive"
                          : ticket.priority === "medium"
                            ? "bg-muted text-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          ticket.priority === "critical" || ticket.priority === "high"
                            ? "bg-destructive"
                            : "bg-muted-foreground",
                        )}
                      />
                      <span>Prioridad {PRIORITY_META[ticket.priority].label}</span>
                    </span>

                    {/* Category pill */}
                    <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md font-medium">
                      {ticket.category}
                    </span>
                  </div>

                  {/* SLA / Created Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <span>{formatRelativeTime(ticket.createdAt)}</span>
                  </div>
                </div>

                {/* Title and Metadata */}
                <div className="flex flex-col gap-1.5">
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="text-base font-semibold text-foreground hover:text-brand transition-colors cursor-pointer"
                  >
                    {ticket.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-muted-foreground text-xs">
                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5 text-muted-foreground" />
                      <span>
                        Solicitante:{" "}
                        <strong className="text-foreground font-semibold">
                          {requestor?.name ?? "Usuario Solicitante"}
                        </strong>
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span>
                        {site?.name ?? "Sede Central"} • {ticket.area || "Área General"}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>SLA: {formatRelativeTime(ticket.slaDueAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Note Box */}
                {latestActivity ? (
                  <div className="bg-muted/50 p-3.5 rounded-xl flex items-start gap-3 border border-border/50">
                    <StickyNote className="size-4 text-brand shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5 text-xs text-foreground">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Última actualización por {latestAuthor?.name ?? "Especialista"} ({formatRelativeTime(latestActivity.createdAt)}):
                      </span>
                      <p className="italic text-foreground">
                        "{latestActivity.message}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/40 p-3.5 rounded-xl flex items-start gap-3 border border-border/40">
                    <StickyNote className="size-4 text-brand shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Descripción del requerimiento:
                      </span>
                      <p className="line-clamp-2 text-muted-foreground">
                        {ticket.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Card Actions: left text removed as requested, keeping Añadir Observación & Actualizar Estado */}
                <div className="flex items-center justify-end pt-1">
                  <div className="flex items-center gap-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTicketForNote(ticket)}
                      className="gap-1.5 text-xs text-foreground hover:bg-muted"
                    >
                      <MessageSquarePlus className="size-4 text-brand" />
                      <span>Añadir Observación</span>
                    </Button>

                    <div className="w-40">
                      <TicketStatusSelect
                        value={ticket.status}
                        size="sm"
                        onValueChange={(newStatus) => {
                          updateStatus(
                            ticket.id,
                            newStatus,
                            user?.id ?? "usr-1",
                            `Estado actualizado a ${newStatus} desde Mis Asignaciones`,
                          );
                          toast.add({
                            title: "Estado actualizado",
                            description: `Ticket #${ticket.id} ahora está en ${newStatus}.`,
                            type: "success",
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })
          )}
        </section>

        {/* RIGHT COLUMN: Focused Side Panel (4 cols ~ 34%) */}
        <aside aria-label="Panel Lateral Operativo" className="lg:col-span-4 flex flex-col gap-6">
          {/* Widget 1: Quick Actions (Acciones Rápidas) with only "Registrar Horas de Soporte" */}
          <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Acciones Rápidas</h3>
              <Sparkles className="size-4 text-brand" />
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setHoursTicketId(assignedTickets[0]?.id || "");
                  setShowHoursModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-brand-soft/40 text-left transition-all group border border-transparent hover:border-brand/30"
              >
                <div className="size-10 rounded-lg bg-card text-brand flex items-center justify-center shadow-xs group-hover:bg-brand group-hover:text-white transition-colors border border-border">
                  <Timer className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground group-hover:text-brand transition-colors">
                    Registrar Horas de Soporte
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    Cargar tiempo invertido en ticket activo
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Widget 2: Real-Time SLA Monitor & Resumen de Turno */}
          <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-foreground">Resumen de Turno</h3>
                <span className="text-xs text-muted-foreground">Estadísticas de tu actividad semanal</span>
              </div>
              <span className="text-[11px] bg-brand-soft text-brand-soft-fg px-2 py-0.5 rounded-full font-bold">
                En Línea
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-card text-brand flex items-center justify-center shadow-xs border border-border">
                    <FileCheck2 className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Tickets Concluidos</span>
                    <span className="text-[11px] text-muted-foreground">En tu historial</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">{resolvedCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-card text-brand flex items-center justify-center shadow-xs border border-border">
                    <Clock className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Casos en Proceso</span>
                    <span className="text-[11px] text-muted-foreground">Diagnóstico activo</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">{inProgressCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-card text-brand flex items-center justify-center shadow-xs border border-border">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Total Asignaciones</span>
                    <span className="text-[11px] text-muted-foreground">Volumen total</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">{totalAssigned}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">Desempeño acumulado de la semana</span>
              <div className="flex items-center gap-3">
                <svg className="size-16 shrink-0" viewBox="0 0 36 36">
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
                    strokeDasharray={`${effectivenessRate}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                  <text
                    className="text-foreground fill-current text-[8px] font-bold"
                    textAnchor="middle"
                    x="18"
                    y="20.5"
                  >
                    {effectivenessRate}%
                  </text>
                </svg>
                <div className="flex flex-col text-xs text-muted-foreground">
                  <span className="text-foreground font-semibold">{totalAssigned} tickets asignados</span>
                  <span>{resolvedCount} concluidos exitosamente</span>
                  <span className="text-brand font-semibold text-[11px]">{inProgressCount} en curso</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 3: Operational Guide & Protocol Shortcut */}
          <div className="bg-muted/40 border border-border p-5 rounded-xl shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-foreground">
              <Building className="size-4 text-brand" />
              <span className="text-xs font-bold">Guía Operativa Rápida</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Protocolo de escalamiento de fallas críticas en climatización y enlaces principales actualizado para versión activa.
            </p>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() =>
                  toast.add({
                    title: "Manual de Guardia",
                    description: "Abriendo protocolo de soporte operativo v4.2...",
                    type: "info",
                  })
                }
                className="text-xs font-semibold text-brand flex items-center gap-1 hover:underline"
              >
                <span>Abrir Manual de Guardia</span>
                <ChevronRight className="size-3.5" />
              </button>
              <span className="text-[11px] text-muted-foreground font-mono">v4.2</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal: Añadir Observación */}
      <Dialog
        open={Boolean(selectedTicketForNote)}
        onOpenChange={(open) => !open && setSelectedTicketForNote(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Observación</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveObservation} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Ticket: #{selectedTicketForNote?.id} - {selectedTicketForNote?.title}
              </Label>
              <Textarea
                rows={4}
                required
                placeholder="Escribe la actualización o nota del ticket..."
                value={noteMessage}
                onChange={(e) => setNoteMessage(e.target.value)}
                className="text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicketForNote(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-brand text-white hover:bg-brand-hover gap-1.5">
                <Send className="size-3.5" />
                Guardar Observación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar Horas de Soporte */}
      <Dialog open={showHoursModal} onOpenChange={setShowHoursModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Horas de Soporte</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterHours} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hours-ticket" className="text-xs font-medium">
                Solicitud Asociada
              </Label>
              <select
                id="hours-ticket"
                value={hoursTicketId}
                onChange={(e) => setHoursTicketId(e.target.value)}
                className="w-full bg-card border border-border rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-brand"
              >
                {assignedTickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} - {t.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours-amount" className="text-xs font-medium">
                Horas Empleadas (ej: 1.5, 2)
              </Label>
              <Input
                id="hours-amount"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={loggedHours}
                onChange={(e) => setLoggedHours(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours-desc" className="text-xs font-medium">
                Detalle de las labores realizadas
              </Label>
              <Textarea
                id="hours-desc"
                rows={3}
                placeholder="Inspección física, configuración en switch, reemplazo de hardware..."
                value={hoursDescription}
                onChange={(e) => setHoursDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowHoursModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-brand text-white hover:bg-brand-hover gap-1.5">
                <Timer className="size-3.5" />
                Registrar Tiempo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}