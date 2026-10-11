import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useSiteStore, useUserStore } from "@/store";
import { ROLES, ROLE_META, validateEmail, validatePhone } from "@/utils";
import type { Role } from "@/types";

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  role: Role;
  siteId: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "requestor",
  siteId: "",
};

export function UserFormSheet({ open, onOpenChange }: UserFormSheetProps) {
  const sites = useSiteStore((state) => state.items);
  const createUser = useUserStore((state) => state.createUser);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm((prev) => ({ ...emptyForm, siteId: prev.siteId || sites[0]?.id || "" }));
      setErrors({});
    }
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const submit = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    const emailError = validateEmail(form.email);
    if (emailError) nextErrors.email = emailError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) nextErrors.phone = phoneError;
    if (form.role === "requestor" && !form.siteId) {
      nextErrors.siteId = "Selecciona una sede.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const user = createUser({
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      siteId: form.siteId,
    });
    toast.add({
      title: "Usuario creado",
      description: `${user.name} fue agregado al equipo.`,
      type: "success",
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-brand" />
            Crear Nuevo Usuario
          </SheetTitle>
          <SheetDescription>
            Registra un colaborador y asígnalo a una sede.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-1">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre completo</Label>
            <Input
              id="user-name"
              placeholder="Ej.: Laura Peña"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Correo institucional</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="nombre@unicaribe.edu.do"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-phone">Teléfono</Label>
            <Input
              id="user-phone"
              placeholder="+1 809-555-0000"
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
            />
            {errors.phone ? (
              <p className="text-xs text-destructive">{errors.phone}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-role">Rol</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setField("role", (value ?? "requestor") as Role)}
              >
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_META[role].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-site">Sede</Label>
              <Select
                value={form.siteId}
                onValueChange={(value) => setField("siteId", value ?? "")}
              >
                <SelectTrigger id="user-site" className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.siteId ? (
                <p className="text-xs text-destructive">{errors.siteId}</p>
              ) : null}
            </div>
          </div>
        </div>

        <SheetFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Crear Usuario</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}