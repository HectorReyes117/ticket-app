import { useState } from "react";
import {
  Building2,
  Check,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Shield,
  Upload,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { useSiteStore, useUserStore } from "@/store";
import { validateEmail, validatePhone } from "@/utils";
import { cn } from "@/utils";
import type { Role, User as UserType } from "@/types";

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: UserType | null;
}

interface FormState {
  name: string;
  employeeCode: string;
  email: string;
  phone: string;
  extension: string;
  siteId: string;
  department: string;
  title: string;
  role: Role;
  queues: string[];
  generatePasswordLink: boolean;
}

const emptyForm: FormState = {
  name: "",
  employeeCode: "",
  email: "",
  phone: "",
  extension: "",
  siteId: "",
  department: "TI & Infraestructura",
  title: "",
  role: "technician",
  queues: ["Hardware & Servidores", "Redes L2"],
  generatePasswordLink: true,
};

const DEPARTMENTS = [
  "TI & Infraestructura",
  "Redes & Telecomunicaciones",
  "Finanzas & Contabilidad",
  "Operaciones Académicas",
  "Admisiones & Registro",
  "Biblioteca & Recursos",
  "Soporte al Usuario",
  "Seguridad & Climatización",
];

export function UserFormSheet({ open, onOpenChange, userToEdit }: UserFormSheetProps) {
  const sites = useSiteStore((state) => state.items);
  const createUser = useUserStore((state) => state.createUser);
  const updateUser = useUserStore((state) => state.updateUser);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [newQueueInput, setNewQueueInput] = useState("");
  const [showAddQueue, setShowAddQueue] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      if (userToEdit) {
        setForm({
          name: userToEdit.name,
          employeeCode: userToEdit.employeeCode || `#EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          email: userToEdit.email,
          phone: userToEdit.phone,
          extension: userToEdit.extension || "Ext. 4010",
          siteId: userToEdit.siteId || sites[0]?.id || "",
          department: userToEdit.department || "TI & Infraestructura",
          title: userToEdit.title || "",
          role: userToEdit.role,
          queues: userToEdit.queues || ["Hardware & Servidores"],
          generatePasswordLink: true,
        });
      } else {
        setForm({
          ...emptyForm,
          employeeCode: `#EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          siteId: sites[0]?.id || "",
        });
      }
      setErrors({});
    }
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const addQueue = () => {
    const trimmed = newQueueInput.trim();
    if (!trimmed) return;
    if (!form.queues.includes(trimmed)) {
      setField("queues", [...form.queues, trimmed]);
    }
    setNewQueueInput("");
    setShowAddQueue(false);
  };

  const removeQueue = (queue: string) => {
    setField(
      "queues",
      form.queues.filter((q) => q !== queue),
    );
  };

  // Initials for avatar preview
  const initials = form.name.trim()
    ? form.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "NP";

  const submit = async () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = "El nombre completo es obligatorio.";
    const emailError = validateEmail(form.email);
    if (emailError) nextErrors.email = emailError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) nextErrors.phone = phoneError;
    if (!form.siteId) nextErrors.siteId = "Selecciona una sede física.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      if (userToEdit) {
        await updateUser(userToEdit.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          siteId: form.siteId,
          department: form.department,
          title: form.title,
          extension: form.extension,
        });
        toast.add({
          title: "Usuario actualizado",
          description: `Los datos de ${form.name} se han guardado con éxito.`,
          type: "success",
        });
      } else {
        const user = await createUser({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          siteId: form.siteId,
          department: form.department,
          title: form.title || (form.role === "technician" ? "Técnico Especialista" : "Funcionario"),
          extension: form.extension || "Ext. 4010",
          employeeCode: form.employeeCode,
          queues: form.queues,
        });
        toast.add({
          title: "Usuario creado y enrolado",
          description: `${user.name} ha sido configurado en el directorio ITSM con rol ${form.role}.`,
          type: "success",
        });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.add({
        title: "Error al guardar usuario",
        description: err.message || "Ocurrió un problema de comunicación con el servidor.",
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
        {/* HEADER (Pinned) */}
        <header className="p-6 bg-card border-b border-border shrink-0 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0 shadow-xs border border-brand/20">
                <UserPlus className="size-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="text-lg font-bold text-foreground leading-tight truncate">
                  {userToEdit ? "Editar Funcionario / Usuario" : "Nuevo Usuario / Colaborador"}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  Registro institucional en TicketApp y asignación de rol operativo
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-soft text-brand-soft-fg text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-brand animate-pulse" />
              <span>Alta Inmediata / Enrolamiento</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">
              Paso 1 de 1 • Directorio ITSM
            </span>
          </div>
        </header>

        {/* SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* SECCIÓN 1: DATOS PERSONALES E IDENTIDAD */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <User className="size-4 text-brand" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                1. Datos Personales e Identidad
              </h3>
            </div>

            {/* Avatar Preview & Upload Box */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
              <div className="size-14 rounded-full bg-brand text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {initials}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-bold text-foreground">Fotografía de Perfil</span>
                <span className="text-[11px] text-muted-foreground">
                  PNG o JPG de hasta 2MB (Recomendado 200x200px)
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() =>
                      toast.add({
                        title: "Cargar imagen",
                        description: "Selecciona un archivo de imagen en formato PNG o JPG.",
                        type: "info",
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card text-foreground text-xs font-semibold border border-border shadow-xs hover:bg-muted transition-colors"
                  >
                    <Upload className="size-3.5 text-muted-foreground" />
                    <span>Subir Fotografía</span>
                  </button>
                  <span className="text-[11px] text-muted-foreground">Usando iniciales</span>
                </div>
              </div>
            </div>

            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nombres y Apellidos Completos <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ej. Andrés Ignacio Morales"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* ID Corporativo / Cédula */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                ID Corporativo / Cédula / DNI <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="#EMP-9540"
                value={form.employeeCode}
                onChange={(e) => setField("employeeCode", e.target.value)}
                className="text-xs font-mono font-bold text-brand uppercase rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
              />
            </div>

            {/* Correo Electrónico Institucional */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Correo Electrónico Institucional <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="usuario@unicaribe.edu.do"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className="pl-9 text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Teléfono Móvil & Anexo IP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block truncate">
                  Teléfono Móvil
                </label>
                <div className="relative">
                  <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="+1 809-555-0100"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block truncate">
                  Anexo IP Interno
                </label>
                <Input
                  type="text"
                  placeholder="Ext. 4012"
                  value={form.extension}
                  onChange={(e) => setField("extension", e.target.value)}
                  className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: ESTRUCTURA ORGANIZACIONAL */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Building2 className="size-4 text-brand" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                2. Estructura Organizacional
              </h3>
            </div>

            {/* Sede Física / Ubicación */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Sede Física / Ubicación Asignada <span className="text-destructive">*</span>
              </label>
              <select
                value={form.siteId}
                onChange={(e) => setField("siteId", e.target.value)}
                className="w-full bg-muted/60 text-foreground text-xs font-medium rounded-xl p-3 border border-border focus:ring-1 focus:ring-brand"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} — {site.city}
                  </option>
                ))}
              </select>
              {errors.siteId && <p className="text-xs text-destructive">{errors.siteId}</p>}
            </div>

            {/* Departamento / Unidad Operativa */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Departamento / Unidad Operativa <span className="text-destructive">*</span>
              </label>
              <select
                value={form.department}
                onChange={(e) => setField("department", e.target.value)}
                className="w-full bg-muted/60 text-foreground text-xs font-medium rounded-xl p-3 border border-border focus:ring-1 focus:ring-brand"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Cargo / Posición Oficial */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cargo / Posición Oficial
              </label>
              <Input
                type="text"
                placeholder="ej. Especialista L2 Soporte / Infraestructura"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className="text-xs rounded-xl bg-muted/50 border-border focus-visible:ring-brand"
              />
            </div>
          </section>

          {/* SECCIÓN 3: ASIGNACIÓN DE ROL PREESTABLECIDO */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Shield className="size-4 text-brand" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                3. Rol Preestablecido y Especialidad
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Opción 1: Técnico Especialista */}
              <label
                onClick={() => setField("role", "technician")}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all select-none",
                  form.role === "technician"
                    ? "border-brand bg-brand-soft/70 shadow-xs"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="user_role"
                  checked={form.role === "technician"}
                  onChange={() => setField("role", "technician")}
                  className="accent-brand mt-0.5"
                />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">
                      Técnico Especialista (L1 / L2)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-soft-fg text-[10px] font-bold">
                      Resolutor
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Permite resolver tickets, bitácora técnica, cambio de estados e integración en turnos de guardia.
                  </p>

                  {/* Sub-configuración de colas para técnicos */}
                  {form.role === "technician" && (
                    <div className="mt-2 pt-2 border-t border-brand/20 flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-foreground">
                        Colas y Especialidad Principal Asignada:
                      </span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {form.queues.map((q) => (
                          <span
                            key={q}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-foreground text-[10px] font-medium shadow-xs"
                          >
                            <span>{q}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQueue(q);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}

                        {showAddQueue ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="text"
                              autoFocus
                              placeholder="Nueva cola"
                              value={newQueueInput}
                              onChange={(e) => setNewQueueInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQueue())}
                              className="h-6 text-[11px] w-28 rounded-md bg-card"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={addQueue}
                              className="h-6 px-1.5 text-[10px] bg-brand text-white hover:bg-brand-hover"
                            >
                              <Check className="size-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAddQueue(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed border-border hover:border-brand text-muted-foreground hover:text-brand text-[10px] font-medium transition-colors"
                          >
                            <Plus className="size-3" />
                            <span>Añadir Cola</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Opción 2: Solicitante Departamental */}
              <label
                onClick={() => setField("role", "requestor")}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all select-none",
                  form.role === "requestor"
                    ? "border-brand bg-brand-soft/70 shadow-xs"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="user_role"
                  checked={form.role === "requestor"}
                  onChange={() => setField("role", "requestor")}
                  className="accent-brand mt-0.5"
                />
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">
                      Solicitante Departamental / Usuario
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                      Básico
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Permite registrar requerimientos e incidencias para su área institucional y dar seguimiento a sus casos.
                  </p>
                </div>
              </label>

              {/* Opción 3: Administrador / Supervisor */}
              <label
                onClick={() => setField("role", "admin")}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all select-none",
                  form.role === "admin"
                    ? "border-brand bg-brand-soft/70 shadow-xs"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="user_role"
                  checked={form.role === "admin"}
                  onChange={() => setField("role", "admin")}
                  className="accent-brand mt-0.5"
                />
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">
                      Administrador / Supervisor
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-bold">
                      Total
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Acceso total a configuración institucional, CRUD de usuarios, auditoría de gestión y reasignación directa.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* SECCIÓN 4: PARÁMETROS DE ACCESO Y SEGURIDAD */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <KeyRound className="size-4 text-brand" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                4. Parámetros de Acceso y Seguridad
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    Generar contraseña temporal al correo corporativo
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Se emitirá un enlace único y cifrado para configurar la contraseña en el primer acceso.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.generatePasswordLink}
                  onChange={(e) => setField("generatePasswordLink", e.target.checked)}
                  className="size-4 accent-brand cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    Estado inicial de cuenta
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    El colaborador quedará disponible de inmediato en las colas activas.
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-soft text-brand-soft-fg text-[11px] font-bold shrink-0">
                  <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                  <span>Activo / En Turno</span>
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* FOOTER (Pinned) */}
        <footer className="p-4 bg-muted/40 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold rounded-xl border-border bg-card"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={submit}
            className="gap-2 text-xs font-semibold rounded-xl bg-brand hover:bg-brand-hover text-white shadow-xs"
          >
            <UserCheck className="size-4" />
            <span>{userToEdit ? "Guardar Cambios" : "Crear Usuario y Activar Acceso"}</span>
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}