import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Airplay,
  AlertCircle,
  Building,
  CheckCircle2,
  Code,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  FolderSync,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Link as LinkIcon,
  List,
  Network,
  Paperclip,
  Send,
  Server,
  SlidersHorizontal,
  Trash2,
  Type,
  UploadCloud,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { PRIORITIES, PRIORITY_META } from "@/utils";
import { cn, required } from "@/utils";
import type { Priority } from "@/types";

// Visual 5 categories exactly matching Stitch screen
interface StitchCategoryItem {
  key: string;
  label: string;
  subtitle: string;
  icon: typeof Server;
  defaultSubcategory: string;
}

const STITCH_CATEGORIES: StitchCategoryItem[] = [
  {
    key: "infra",
    label: "Climatización & Datacenter",
    subtitle: "Activo",
    icon: Server,
    defaultSubcategory: "Energía / Climatización",
  },
  {
    key: "networks",
    label: "Redes & Conectividad",
    subtitle: "L1/L2 Ops",
    icon: Network,
    defaultSubcategory: "Red inalámbrica / Enlace",
  },
  {
    key: "software",
    label: "Soporte & Software",
    subtitle: "Apps Core",
    icon: FileCode,
    defaultSubcategory: "Error de software / Sistema",
  },
  {
    key: "hardware",
    label: "Hardware & Equipos",
    subtitle: "Inventario IT",
    icon: Airplay,
    defaultSubcategory: "Falla de hardware / PC",
  },
  {
    key: "security",
    label: "Seguridad & Accesos",
    subtitle: "IAM & VPN",
    icon: KeyRound,
    defaultSubcategory: "Credenciales / Permisos",
  },
];

type RequestType = "incident" | "requirement" | "maintenance";
type ImpactLevel = "single" | "department" | "critical";

interface FormState {
  requestorId: string;
  siteId: string;
  area: string;
  categoryKey: string;
  requestType: RequestType;
  priority: Priority;
  impact: ImpactLevel;
  title: string;
  description: string;
  notifyEmail: boolean;
  intelligentRouting: boolean;
}

interface AttachmentFile {
  id: string;
  name: string;
  size: string;
  timeAgo: string;
  status: string;
  type: "image" | "log";
}

export function TicketForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);
  const createTicket = useTicketStore((state) => state.createTicket);

  const [form, setForm] = useState<FormState>({
    requestorId: user?.id ?? "",
    siteId: user?.siteId ?? (sites[0]?.id || ""),
    area: sites[0]?.areas[0] || "",
    categoryKey: "infra",
    requestType: "incident",
    priority: "medium",
    impact: "department",
    title: "",
    description: "",
    notifyEmail: true,
    intelligentRouting: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);
  const selectedRequestor = users.find((u) => u.id === form.requestorId) ?? user;
  const currentCategory = STITCH_CATEGORIES.find((c) => c.key === form.categoryKey) ?? STITCH_CATEGORIES[0];

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.requestorId && !user?.id) nextErrors.requestorId = required(form.requestorId);
    if (!form.title.trim()) {
      nextErrors.title = required(form.title);
    } else if (form.title.trim().length < 8) {
      nextErrors.title = "Describe el asunto con al menos 8 caracteres.";
    }

    if (!form.description.trim()) {
      nextErrors.description = "Describe el problema en detalle.";
    } else if (form.description.trim().length < 15) {
      nextErrors.description = "Detalla el problema con al menos 15 caracteres.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.add({
        title: "Campos incompletos",
        description: "Revisa los campos obligatorios antes de enviar.",
        type: "error",
      });
      return;
    }

    try {
      const ticket = await createTicket({
        title: form.title,
        description: form.description,
        category: currentCategory.label,
        subcategory: currentCategory.defaultSubcategory,
        priority: form.priority,
        requestorId: form.requestorId || user?.id || "usr-1",
        siteId: form.siteId || (sites[0]?.id ?? "1"),
        area: form.area || "Datacenter Piso 1",
      });

      toast.add({
        title: "Solicitud creada y enrutada",
        description: `Se registró con éxito la solicitud #${ticket.id}.`,
        type: "success",
      });
      navigate(`/tickets/${ticket.id}`);
    } catch (err: any) {
      toast.add({
        title: "Error al registrar la solicitud",
        description: err.message || "No fue posible conectar con el servidor.",
        type: "danger",
      });
    }
  };

  const addAttachmentSimulated = () => {
    const isPng = Math.random() > 0.5;
    const newFile: AttachmentFile = {
      id: Date.now().toString(),
      name: isPng ? `captura_evidencia_${Date.now().toString().slice(-4)}.png` : `registro_evento_${Date.now().toString().slice(-4)}.log`,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      timeAgo: "Subido recién",
      status: "Verificado",
      type: isPng ? "image" : "log",
    };
    setAttachments((prev) => [...prev, newFile]);
    toast.add({
      title: "Archivo adjuntado",
      description: newFile.name,
      type: "success",
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Main Form Steps (8 cols) */}
      <form onSubmit={handleSubmit} className="xl:col-span-8 space-y-6">
        {/* CARD 1: Core Ticket Classification */}
        <div className="bg-card rounded-2xl p-6 shadow-xs border border-border flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                <Layers className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  1. Información Principal del Requerimiento
                </h2>
                <p className="text-xs text-muted-foreground">
                  Clasificación inicial para categorizar y estimar el impacto operacional
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-soft text-brand-soft-fg">
              Paso 1 de 3
            </span>
          </div>

          {/* Ticket Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ticket-title" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Asunto / Título de la Solicitud</span>
              <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="ticket-title"
                type="text"
                maxLength={120}
                placeholder="Ej: Falla en enlace troncal de fibra óptica rack C - Sala de Servidores Central"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className="pr-16 text-sm py-2.5 rounded-xl border-border bg-card focus-visible:ring-brand"
              />
              <div className="absolute right-3 top-3 text-muted-foreground text-xs font-medium pointer-events-none">
                <span>{form.title.length}</span>/120
              </div>
            </div>
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Service Category Picker (5 cards with exact Stitch icons & layout) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Categoría de Servicio</span>
                <span className="text-destructive">*</span>
              </label>
              <span className="text-xs text-muted-foreground">Selecciona el dominio tecnológico</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {STITCH_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = form.categoryKey === cat.key;
                return (
                  <label
                    key={cat.key}
                    onClick={() => setField("categoryKey", cat.key)}
                    className={cn(
                      "relative flex flex-col items-center text-center p-3.5 rounded-xl border cursor-pointer transition-all group select-none",
                      isSelected
                        ? "border-2 border-brand bg-brand-soft/70 text-brand shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:border-border",
                    )}
                  >
                    <IconComponent
                      className={cn(
                        "size-7 mb-1 transition-transform group-hover:scale-110",
                        isSelected ? "text-brand" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                      {cat.label}
                    </span>
                    {isSelected ? (
                      <span className="text-[11px] font-semibold text-brand mt-1 flex items-center gap-0.5">
                        <CheckCircle2 className="size-3" /> Activo
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground mt-1">
                        {cat.subtitle}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Type and Urgency in 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Type pills */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-foreground">Tipo de Solicitud</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl">
                {[
                  { key: "incident" as RequestType, label: "Incidencia" },
                  { key: "requirement" as RequestType, label: "Requerimiento" },
                  { key: "maintenance" as RequestType, label: "Mantenimiento" },
                ].map((t) => {
                  const isSelected = form.requestType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setField("requestType", t.key)}
                      className={cn(
                        "flex items-center justify-center py-2 px-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-center",
                        isSelected
                          ? "bg-card text-brand font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Urgency & Priority pills */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Nivel de Urgencia & Prioridad</label>
                <span className="text-xs text-brand font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-brand" /> Nivel asignado
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map((p) => {
                  const meta = PRIORITY_META[p];
                  const isSelected = form.priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setField("priority", p)}
                      className={cn(
                        "flex items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all",
                        isSelected
                          ? "border-2 border-brand bg-brand-soft/80 text-brand shadow-xs font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Technical Description & Environment */}
        <div className="bg-card rounded-2xl p-6 shadow-xs border border-border flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                <FileText className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  2. Detalle y Descripción Técnica
                </h2>
                <p className="text-xs text-muted-foreground">
                  Síntomas observados, topología y diagnóstico preliminar
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
              Paso 2 de 3
            </span>
          </div>

          {/* Rich-style Textarea & Action Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="ticket-desc" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Descripción Detallada del Incidente</span>
                <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button
                  type="button"
                  title="Negrita"
                  className="p-1 hover:bg-accent hover:text-foreground rounded transition-colors"
                >
                  <Type className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Código"
                  className="p-1 hover:bg-accent hover:text-foreground rounded transition-colors"
                >
                  <Code className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Lista con viñetas"
                  className="p-1 hover:bg-accent hover:text-foreground rounded transition-colors"
                >
                  <List className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Insertar enlace"
                  className="p-1 hover:bg-accent hover:text-foreground rounded transition-colors"
                >
                  <LinkIcon className="size-3.5" />
                </button>
              </div>
            </div>
            <Textarea
              id="ticket-desc"
              rows={5}
              placeholder="Detalla paso a paso el incidente, síntomas observados, equipos o sistemas involucrados..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className="w-full bg-card p-4 rounded-xl text-sm text-foreground border-border focus-visible:ring-brand leading-relaxed resize-y"
            />
            {errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" /> {errors.description}
              </p>
            )}
          </div>

          {/* Location & Operational Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ticket-location" className="text-xs font-semibold text-foreground">
                Ubicación y Sede Física
              </label>
              <div className="relative">
                <Building className="size-4 absolute left-3.5 top-3 text-muted-foreground pointer-events-none" />
                <select
                  id="ticket-location"
                  value={form.siteId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setField("siteId", sid);
                    const s = sites.find((x) => x.id === sid);
                    if (s) setField("area", s.areas[0] || "");
                  }}
                  className="w-full appearance-none bg-card pl-10 pr-10 py-2.5 rounded-xl text-xs font-medium text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.city} (Piso 1)
                    </option>
                  ))}
                  <option value="custom-1">Sede Central - Datacenter Piso 1 (Sala Blanca B)</option>
                  <option value="custom-2">Sede Norte - Centro Logístico y Distribución</option>
                  <option value="custom-3">Planta Industrial - Sala Técnica Este</option>
                  <option value="custom-4">Operación Remota / Nube AWS Región US-East</option>
                </select>
                <div className="absolute right-3.5 top-3 pointer-events-none text-muted-foreground">
                  ▼
                </div>
              </div>
            </div>

            {/* Impact Range Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Impacto Operativo Estimado</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "single" as ImpactLevel, title: "1 Usuario", subtitle: "Local" },
                  { key: "department" as ImpactLevel, title: "Departamento", subtitle: "Múltiple" },
                  { key: "critical" as ImpactLevel, title: "Continuidad", subtitle: "Crítico Global" },
                ].map((imp) => {
                  const isSelected = form.impact === imp.key;
                  return (
                    <button
                      key={imp.key}
                      type="button"
                      onClick={() => setField("impact", imp.key)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                        isSelected
                          ? "border-2 border-brand bg-brand-soft/70 text-brand shadow-xs font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <span className={cn("text-xs font-semibold", isSelected && "text-brand")}>
                        {imp.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{imp.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Evidences & File Attachments */}
        <div className="bg-card rounded-2xl p-6 shadow-xs border border-border flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                <Paperclip className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  3. Adjuntar Evidencias y Documentos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Archivos de volcado, logs de sistema, diagramas o fotos del incidente
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
              Paso 3 de 3
            </span>
          </div>

          {/* Drag and Drop Zone exact Stitch styling */}
          <div
            onClick={addAttachmentSimulated}
            className="border-2 border-dashed border-brand/40 bg-brand-soft/20 hover:bg-brand-soft/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="size-14 rounded-2xl bg-brand-soft/80 flex items-center justify-center text-brand group-hover:scale-110 transition-transform mb-3">
              <UploadCloud className="size-7" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Arrastra capturas, reportes o logs aquí, o{" "}
              <span className="text-brand underline font-bold">explora tus archivos</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Soporta JPG, PNG, PDF, LOG, PCAP, TXT (hasta 25 MB por archivo)
            </p>
          </div>

          {/* Attached Items List */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-muted-foreground">
              Archivos adjuntos en esta solicitud ({attachments.length}):
            </div>

            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    {file.type === "image" ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {file.size} • {file.timeAgo}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Previsualizar"
                    onClick={() =>
                      toast.add({
                        title: "Previsualización",
                        description: `Abriendo ${file.name}`,
                        type: "info",
                      })
                    }
                    className="p-1.5 text-muted-foreground hover:text-brand hover:bg-card rounded-lg transition-colors"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => removeAttachment(file.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-card rounded-lg transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM ACTION BAR exact to Stitch layout */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.notifyEmail}
              onChange={(e) => setField("notifyEmail", e.target.checked)}
              className="size-4 rounded text-brand focus:ring-brand accent-brand"
            />
            <span className="text-xs text-foreground font-medium">
              Notificar confirmación y cambios de estado vía{" "}
              <span className="font-semibold text-brand">Email</span>
            </span>
          </label>
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              Descartar
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs"
            >
              <Send className="size-4" />
              <span>Crear y Enrutar Solicitud</span>
            </Button>
          </div>
        </div>
      </form>

      {/* RIGHT COLUMN: SLA, Requester & Routing Context (4 cols) */}
      <aside className="xl:col-span-4 space-y-6">
        {/* PANEL 1: Requester Identity Profile */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-brand" />
              <span className="text-xs font-bold text-foreground">Datos del Solicitante</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextUser = activeUsers.find((u) => u.id !== form.requestorId) ?? activeUsers[0];
                if (nextUser) setField("requestorId", nextUser.id);
              }}
              className="text-brand hover:underline text-xs font-semibold"
            >
              Cambiar
            </button>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="size-12 rounded-xl bg-brand-soft text-brand font-bold flex items-center justify-center text-sm shadow-xs border border-brand/20">
                {(selectedRequestor?.name ?? "CM")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <span className="absolute -bottom-1 -right-1 size-3.5 bg-brand border-2 border-card rounded-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-foreground truncate">
                {selectedRequestor?.name ?? "Carlos Mendoza"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {selectedRequestor?.email ?? "carlos.mendoza@empresa.com"}
              </span>
              <span className="text-[11px] text-brand font-mono mt-0.5 font-semibold">
                ID: #{selectedRequestor?.id ?? "EMP-9402"}
              </span>
            </div>
          </div>

          <div className="grid gap-2 pt-2 border-t border-border">
            <div className="flex flex-col p-2.5 rounded-xl bg-muted/60">
              <span className="text-muted-foreground text-[11px]">Sede de Origen</span>
              <span className="text-xs font-semibold text-foreground">
                {form.area || "Datacenter Piso 1"}
              </span>
            </div>
          </div>
        </div>

        {/* PANEL 2: SLA Circular Meter & Resolution Commitment */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-brand" />
              <span className="text-xs font-bold text-foreground">
                Nivel de Atención & Prioridad
              </span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-soft text-brand font-semibold">
              Prioridad {PRIORITY_META[form.priority].label}
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <div className="p-3 rounded-xl bg-muted/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Canal de atención asignado:</span>
                <span className="text-[11px] font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded">
                  Nivel 2 Especializado
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El ticket ingresará a la cola de atención inmediata con notificación automática al supervisor técnico de infraestructura de turno.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col p-2.5 rounded-xl border border-border bg-card">
                <span className="text-muted-foreground text-[11px]">Tipo de Escalamiento</span>
                <span className="text-xs font-semibold text-foreground">Directo a Nodo L2</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-xl border border-border bg-card">
                <span className="text-muted-foreground text-[11px]">Seguimiento</span>
                <span className="text-xs font-semibold text-brand flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-brand animate-pulse" /> Monitoreo Activo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3: Automated Intelligent Assignment */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderSync className="size-4 text-brand" />
              <span className="text-xs font-bold text-foreground">Enrutamiento Inteligente</span>
            </div>
            {/* Interactive Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.intelligentRouting}
                onChange={(e) => setField("intelligentRouting", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand" />
            </label>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/60 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Especialista sugerido por carga:</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-brand-soft text-brand-soft-fg font-bold">
                96% Afinidad
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-brand-soft text-brand font-bold flex items-center justify-center text-xs shadow-xs shrink-0 border border-brand/20">
                VR
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">
                  Ing. Valeria Rosas
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  Especialista Óptica & Routers
                </span>
                <span className="text-[11px] text-brand flex items-center gap-1 mt-0.5 font-medium">
                  <span className="size-1.5 rounded-full bg-brand" /> Disponible • 3 tickets en cola
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 4: Rapid Resolution Tips */}
        <div className="bg-card rounded-2xl p-5 shadow-xs border border-border flex flex-col gap-3.5">
          <div className="flex items-center gap-2 text-foreground">
            <Zap className="size-4 text-brand" />
            <span className="text-xs font-bold">Buenas Prácticas para Resolución Rápida</span>
          </div>

          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-brand shrink-0 mt-0.5" />
              <span>Indicar el número de rack, patch-panel o serial del hardware averiado.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-brand shrink-0 mt-0.5" />
              <span>Verificar si las fuentes de alimentación redundantes tienen LED verde.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-brand shrink-0 mt-0.5" />
              <span>Adjuntar captura con el código de error numérico exacto o volcado de syslog.</span>
            </li>
          </ul>

          <div className="mt-2 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">¿Dudas con la clasificación?</span>
            <button
              type="button"
              onClick={() =>
                toast.add({
                  title: "Matriz ITIL",
                  description: "Clasificación estándar: Severidad 1 a 4 según impacto.",
                  type: "info",
                })
              }
              className="text-brand font-bold hover:underline flex items-center gap-1"
            >
              <span>Consultar Matriz ITIL</span>
              <ExternalLink className="size-3" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}