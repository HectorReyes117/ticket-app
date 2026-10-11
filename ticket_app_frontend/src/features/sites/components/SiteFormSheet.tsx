import { useState } from "react";
import { Building2 } from "lucide-react";
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
import { toast } from "@/components/ui/toast";
import { useSiteStore } from "@/store";
import { SITE_AREAS_EXAMPLE } from "../data/mockSites";
import { required, validatePhone } from "@/utils";
import { cn } from "@/utils";
import { Check } from "lucide-react";

interface SiteFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  name: string;
  address: string;
  city: string;
  phone: string;
  areas: string[];
}

const emptyForm: FormState = {
  name: "",
  address: "",
  city: "",
  phone: "",
  areas: [],
};

export function SiteFormSheet({ open, onOpenChange }: SiteFormSheetProps) {
  const createSite = useSiteStore((state) => state.createSite);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [customArea, setCustomArea] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(emptyForm);
      setCustomArea("");
      setErrors({});
    }
  }

  const toggleArea = (area: string) => {
    setForm((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }));
  };

  const addCustomArea = () => {
    const value = customArea.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      areas: prev.areas.includes(value)
        ? prev.areas
        : [...prev.areas, value],
    }));
    setCustomArea("");
  };

  const submit = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = "El nombre de la sede es obligatorio.";
    const addressError = required(form.address);
    if (addressError) nextErrors.address = addressError;
    const cityError = required(form.city);
    if (cityError) nextErrors.city = cityError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) nextErrors.phone = phoneError;
    if (form.areas.length === 0) {
      nextErrors.areas = "Selecciona al menos un área.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const site = createSite({
      name: form.name,
      address: form.address,
      city: form.city,
      phone: form.phone,
      areas: form.areas,
    });
    toast.add({
      title: "Sede creada",
      description: `${site.name} fue registrada correctamente.`,
      type: "success",
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-brand" />
            Crear Nueva Sede
          </SheetTitle>
          <SheetDescription>
            Registra una sede y define sus áreas de servicio.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-1">
          <div className="space-y-2">
            <Label htmlFor="site-name">Nombre de la sede</Label>
            <Input
              id="site-name"
              placeholder="Ej.: Extensión San Pedro"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-address">Dirección</Label>
            <Input
              id="site-address"
              placeholder="Av., calle o autopista"
              value={form.address}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
            />
            {errors.address ? (
              <p className="text-xs text-destructive">{errors.address}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site-city">Ciudad</Label>
              <Input
                id="site-city"
                placeholder="Santo Domingo"
                value={form.city}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, city: event.target.value }))
                }
              />
              {errors.city ? (
                <p className="text-xs text-destructive">{errors.city}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-phone">Teléfono</Label>
              <Input
                id="site-phone"
                placeholder="+1 809-555-0000"
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
              {errors.phone ? (
                <p className="text-xs text-destructive">{errors.phone}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Áreas de servicio</Label>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {SITE_AREAS_EXAMPLE.map((area) => {
                const selected = form.areas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleArea(area)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                      selected
                        ? "border-brand/50 bg-brand-soft text-brand-soft-fg"
                        : "border-border bg-card text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {area}
                    {selected ? <Check className="size-4" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Otras áreas…"
                value={customArea}
                onChange={(event) => setCustomArea(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomArea();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomArea}
                disabled={!customArea.trim()}
              >
                Agregar
              </Button>
            </div>
            {errors.areas ? (
              <p className="text-xs text-destructive">{errors.areas}</p>
            ) : null}
          </div>
        </div>

        <SheetFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Crear Sede</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}