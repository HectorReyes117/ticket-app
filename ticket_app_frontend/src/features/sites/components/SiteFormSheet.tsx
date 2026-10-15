import { useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Layers,
  MapPin,
  Plus,
  Shield,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { useSiteStore, useUserStore } from "@/store";
import { cn } from "@/utils";

interface SiteFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type InstallationType = "campus" | "dc" | "regional" | "almacen";

interface FormState {
  name: string;
  type: InstallationType;
  code: string;
  address: string;
  city: string;
  postalCode: string;
  levels: string;
  capacity: string;
  custodianId: string;
  phone: string;
  extension: string;
  securityNotes: string;
  areas: string[];
}

const emptyForm: FormState = {
  name: "Sede Central Datacenter Piso 2",
  type: "campus",
  code: "#SED-0840",
  address: "Av. Andrés Bello 2711, Las Condes",
  city: "Santiago / Las Condes / RM",
  postalCode: "7550000 • Frente a Metro Tobalaba",
  levels: "Subterráneo -1, Piso 1 (Recepción), Piso 2 (IT & Servidores)",
  capacity: "350 personas",
  custodianId: "",
  phone: "+56 2 2840 9200",
  extension: "Ext. 8401",
  securityNotes:
    "Acceso restringido con tarjeta biométrica 24/7. Notificar a guardia antes de ingresar contratistas. Tableros eléctricos ubicados en sector norponiente.",
  areas: ["Sala Servidores", "Datacenter Nivel 1", "Taller Soporte IT"],
};

export function SiteFormSheet({ open, onOpenChange }: SiteFormSheetProps) {
  const createSite = useSiteStore((state) => state.createSite);
  const users = useUserStore((state) => state.items);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newAreaInput, setNewAreaInput] = useState("");
  const [showAddAreaInput, setShowAddAreaInput] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const custodians = users.filter((u) => u.active);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const removeArea = (area: string) => {
    setForm((prev) => ({
      ...prev,
      areas: prev.areas.filter((a) => a !== area),
    }));
  };

  const addArea = () => {
    const val = newAreaInput.trim();
    if (!val) return;
    if (!form.areas.includes(val)) {
      setForm((prev) => ({ ...prev, areas: [...prev.areas, val] }));
    }
    setNewAreaInput("");
    setShowAddAreaInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = "El nombre oficial es obligatorio.";
    if (!form.address.trim()) nextErrors.address = "La dirección física es obligatoria.";
    if (!form.city.trim()) nextErrors.city = "La ciudad o región es requerida.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await createSite({
        name: form.name,
        address: form.address,
        city: form.city,
        phone: form.phone,
        areas: form.areas.length > 0 ? form.areas : ["Área General"],
      });

      toast.add({
        title: "Sede registrada exitosamente",
        description: `${form.name} ha sido agregada al inventario corporativo.`,
        type: "success",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.add({
        title: "Error al registrar sede",
        description: err.message || "No se pudo comunicar con el servidor.",
        type: "danger",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full sm:max-w-[640px] flex-col p-0 bg-card border-border shadow-2xl"
      >
        {/* DRAWER HEADER (Pinned) */}
        <header className="p-6 bg-card border-b border-border shrink-0 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0 shadow-xs border border-brand/20">
                <Building2 className="size-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="text-lg font-bold text-foreground leading-tight truncate">
                  Nueva Sede / Ubicación Física
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  Registro en infraestructura TicketApp y asignación de responsables
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Context Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-semibold">
              <Layers className="size-3.5 text-brand" />
              <span>Infraestructura ITSM</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-brand-soft text-brand-soft-fg text-[11px] font-bold">
              Paso 1 de 1 • Configuración
            </span>
          </div>
        </header>

        {/* DRAWER SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* SECCIÓN 1: DATOS GENERALES */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Building2 className="size-4 text-brand" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  1. Datos Generales de la Sede
                </h3>
              </div>

              {/* Nombre Oficial */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Nombre Oficial de la Sede / Instalación <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">Identificador primario</span>
                </div>
                <div className="relative">
                  <MapPin className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="ej. Sede Central Datacenter Piso 2"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Radio Chips: Tipo de Instalación */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tipo de Instalación <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "campus" as InstallationType, label: "Campus / Edificio" },
                    { key: "dc" as InstallationType, label: "Centro Datos (DC)" },
                    { key: "regional" as InstallationType, label: "Sucursal Regional" },
                    { key: "almacen" as InstallationType, label: "Almacén / Taller IT" },
                  ].map((t) => {
                    const isSelected = form.type === t.key;
                    return (
                      <label
                        key={t.key}
                        onClick={() => setField("type", t.key)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all select-none",
                          isSelected
                            ? "border-brand bg-brand-soft/70 text-brand font-semibold shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <input
                          type="radio"
                          name="type_inst"
                          checked={isSelected}
                          onChange={() => setField("type", t.key)}
                          className="accent-brand"
                        />
                        <span className="truncate">{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Código Identificador Corporativo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Código Identificador / ID Corporativo <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="#SED-0840"
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value)}
                  className="text-xs font-mono font-bold text-brand rounded-xl bg-muted/50 border-border focus-visible:ring-brand uppercase"
                />
              </div>

              {/* Dirección Física Completa */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Dirección Física Completa <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Calle, Número, Edificio, Número de Acceso"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>

              {/* Ciudad / Región */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ciudad / Región <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="ej. Santo Domingo / DN"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>

              {/* Código Postal / Referencia */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Código Postal / Referencia
                </label>
                <Input
                  type="text"
                  placeholder="10101 • Referencia"
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                />
              </div>
            </section>

            {/* SECCIÓN 2: UBICACIONES INTERNAS & ESTRUCTURA */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Layers className="size-4 text-brand" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  2. Ubicaciones Internas & Estructura
                </h3>
              </div>

              {/* Niveles o Pisos Disponibles */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Niveles o Pisos Disponibles
                </label>
                <Input
                  type="text"
                  placeholder="ej. Subterráneo -1, Piso 1, Piso 2"
                  value={form.levels}
                  onChange={(e) => setField("levels", e.target.value)}
                  className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                />
              </div>

              {/* Salas Técnicas / Áreas Específicas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Salas Técnicas / Áreas Específicas
                  </label>
                  <span className="text-xs text-brand font-semibold">
                    {form.areas.length} añadidas
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border min-h-[48px]">
                  {form.areas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card text-foreground text-xs font-medium border border-border shadow-xs"
                    >
                      <Layers className="size-3 text-brand" />
                      <span>{area}</span>
                      <button
                        type="button"
                        onClick={() => removeArea(area)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}

                  {showAddAreaInput ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="text"
                        autoFocus
                        placeholder="Nueva sala/área"
                        value={newAreaInput}
                        onChange={(e) => setNewAreaInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArea())}
                        className="h-7 text-xs w-36 rounded-lg bg-card"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addArea}
                        className="h-7 px-2 text-xs bg-brand text-white hover:bg-brand-hover"
                      >
                        <Check className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddAreaInput(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-soft hover:bg-brand-soft/80 text-brand-soft-fg text-xs font-semibold transition-colors"
                    >
                      <Plus className="size-3" />
                      <span>Añadir Espacio</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Capacidad Estimada Personal */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Capacidad Estimada Personal
                </label>
                <div className="relative">
                  <Users className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="ej. 350 personas"
                    value={form.capacity}
                    onChange={(e) => setField("capacity", e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                  />
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: CUSTODIO / RESPONSABLE TÉCNICO EN SITIO */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Shield className="size-4 text-brand" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  3. Custodio / Responsable Técnico en Sitio
                </h3>
              </div>

              {/* Selector de Custodio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Seleccionar Custodio o Encargado Titular <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.custodianId}
                  onChange={(e) => setField("custodianId", e.target.value)}
                  className="w-full bg-muted/60 text-foreground text-xs font-medium rounded-xl p-3 border border-border focus:ring-1 focus:ring-brand"
                >
                  {custodians.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Teléfono & Anexo IP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block truncate">
                    Teléfono de Contacto en Sitio
                  </label>
                  <Input
                    type="text"
                    placeholder="+1 809 ..."
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block truncate">
                    Anexo IP de Guardia
                  </label>
                  <Input
                    type="text"
                    placeholder="Ext. 8401"
                    value={form.extension}
                    onChange={(e) => setField("extension", e.target.value)}
                    className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                  />
                </div>
              </div>

              {/* Notas de Acceso Físico / Protocolo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Notas de Acceso Físico / Protocolo de Seguridad
                  </label>
                  <span className="text-[11px] text-muted-foreground">Visible para despachadores</span>
                </div>
                <Textarea
                  rows={3}
                  value={form.securityNotes}
                  onChange={(e) => setField("securityNotes", e.target.value)}
                  placeholder="Indicar condiciones de acceso, tarjetas RFID o protocolos de seguridad..."
                  className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand resize-none"
                />
              </div>

              {/* Notice Banner */}
              <div className="p-3.5 rounded-xl bg-brand-soft/40 border border-brand/20 flex items-start gap-3 text-foreground text-xs">
                <CheckCircle2 className="size-4 text-brand shrink-0 mt-0.5" />
                <p className="leading-snug text-muted-foreground">
                  Al registrar esta sede, estará disponible de forma inmediata en los selectores de incidentes, solicitudes de hardware e inventario de activos físicos de TicketApp.
                </p>
              </div>
            </section>
          </div>

          {/* DRAWER FOOTER (Pinned) */}
          <footer className="p-4 bg-card border-t border-border flex items-center justify-between gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl px-5 shadow-xs"
            >
              <span>Registrar Sede en Producción</span>
            </Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}