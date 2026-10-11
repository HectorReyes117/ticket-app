import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { useAuth } from "@/context/auth-context";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { PRIORITIES, PRIORITY_META, SERVICE_CATEGORIES } from "@/utils";
import { cn, required } from "@/utils";
import type { Priority } from "@/types";

const STEPS = [
  { id: 0, label: "Solicitud" },
  { id: 1, label: "Detalles" },
  { id: 2, label: "Confirmación" },
] as const;

interface FormState {
  requestorId: string;
  siteId: string;
  area: string;
  category: string;
  subcategory: string;
  priority: Priority;
  title: string;
  description: string;
}

const emptyForm: FormState = {
  requestorId: "",
  siteId: "",
  area: "",
  category: "",
  subcategory: "",
  priority: "medium",
  title: "",
  description: "",
};

export function TicketForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const users = useUserStore((state) => state.items);
  const sites = useSiteStore((state) => state.items);
  const createTicket = useTicketStore((state) => state.createTicket);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    requestorId: user?.id ?? "",
    siteId: user?.siteId ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const attendees = useMemo(
    () => users.filter((u) => u.active),
    [users],
  );
  const selectedSite = sites.find((s) => s.id === form.siteId);
  const selectedCategory = SERVICE_CATEGORIES.find(
    (c) => c.label === form.category,
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validateStep = (target: number): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (target === 1) {
      if (!form.requestorId) nextErrors.requestorId = required(form.requestorId);
      if (!form.siteId) nextErrors.siteId = "Selecciona una sede.";
      if (!form.area) nextErrors.area = "Selecciona un área.";
    }
    if (target === 2) {
      if (!form.category) nextErrors.category = "Selecciona una categoría.";
      if (!form.subcategory) nextErrors.subcategory = "Selecciona un tipo.";
      if (!form.title) nextErrors.title = required(form.title);
      if (form.title.trim().length < 8) {
        nextErrors.title = "Describe el asunto con al menos 8 caracteres.";
      }
      if (!form.description.trim()) {
        nextErrors.description = "Describe el problema en detalle.";
      } else if (form.description.trim().length < 20) {
        nextErrors.description = "Detalla el problema con al menos 20 caracteres.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    const target = step + 1;
    if (!validateStep(target)) return;
    setStep(target);
  };

  const back = () => setStep((value) => Math.max(0, value - 1));

  const submit = () => {
    if (!validateStep(2)) {
      setStep(0);
      return;
    }
    const ticket = createTicket({
      title: form.title,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      priority: form.priority,
      requestorId: form.requestorId,
      siteId: form.siteId,
      area: form.area,
    });
    toast.add({
      title: "Solicitud creada",
      description: `La solicitud fue registrada correctamente.`,
      type: "success",
    });
    navigate(`/tickets/${ticket.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <ol className="flex items-center gap-0">
            {STEPS.map((item, index) => (
              <li key={item.id} className="flex flex-1 items-center gap-2 last:flex-none">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    index < step && "bg-status-resolved text-status-resolved-fg",
                    index === step && "bg-brand text-white",
                    index > step && "bg-muted text-muted-foreground",
                  )}
                >
                  {index < step ? <CheckCircle2 className="size-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    index === step ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
                {index < STEPS.length - 1 ? (
                  <span className="mx-3 h-px flex-1 bg-border" />
                ) : null}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-6">
          {step === 0 ? (
            <>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestorId">Solicitante</Label>
                  <Select
                    value={form.requestorId}
                    onValueChange={(value) => setField("requestorId", value ?? "")}
                  >
                    <SelectTrigger id="requestorId" className="w-full">
                      <SelectValue placeholder="Selecciona el solicitante" />
                    </SelectTrigger>
                    <SelectContent>
                      {attendees.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.requestorId ? (
                    <p className="text-xs text-destructive">{errors.requestorId}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteId">Sede</Label>
                  <Select
                    value={form.siteId}
                    onValueChange={(value) => {
                      setField("siteId", value ?? "");
                      setField("area", "");
                    }}
                  >
                    <SelectTrigger id="siteId" className="w-full">
                      <SelectValue placeholder="Selecciona la sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites
                        .filter((s) => s.active)
                        .map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name} · {site.city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.siteId ? (
                    <p className="text-xs text-destructive">{errors.siteId}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Área</Label>
                  <Select
                    value={form.area}
                    onValueChange={(value) => setField("area", value ?? "")}
                    disabled={!selectedSite}
                  >
                    <SelectTrigger id="area" className="w-full">
                      <SelectValue
                        placeholder={
                          selectedSite ? "Selecciona el área" : "Primero selecciona una sede"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSite?.areas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.area ? (
                    <p className="text-xs text-destructive">{errors.area}</p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => {
                      setField("category", value ?? "");
                      setField("subcategory", "");
                    }}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Selecciona la categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => (
                        <SelectItem key={category.label} value={category.label}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category ? (
                    <p className="text-xs text-destructive">{errors.category}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Tipo de incidencia</Label>
                  <Select
                    value={form.subcategory}
                    onValueChange={(value) => setField("subcategory", value ?? "")}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger id="subcategory" className="w-full">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory?.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subcategory ? (
                    <p className="text-xs text-destructive">{errors.subcategory}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      aria-pressed={form.priority === priority}
                      onClick={() => setField("priority", priority)}
                      className={cn(
                        "flex items-center justify-center rounded-lg border px-3 py-2.5 transition-colors",
                        form.priority === priority
                          ? "border-brand/50 bg-brand-soft"
                          : "border-border bg-card hover:bg-accent",
                      )}
                    >
                      <PriorityBadge priority={priority} />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Prioridad seleccionada: {PRIORITY_META[form.priority].label}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Asunto</Label>
                <Input
                  id="title"
                  placeholder="Resumen breve del problema"
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                />
                {errors.title ? (
                  <p className="text-xs text-destructive">{errors.title}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Describe el problema: cuándo empezó, equipos afectados y cualquier detalle relevante…"
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                />
                {errors.description ? (
                  <p className="text-xs text-destructive">{errors.description}</p>
                ) : null}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <dl className="divide-y divide-border rounded-xl border border-border">
                {[
                  { label: "Solicitante", value: attendees.find((u) => u.id === form.requestorId)?.name ?? "—" },
                  {
                    label: "Sede",
                    value: selectedSite
                      ? `${selectedSite.name} · ${selectedSite.city}`
                      : undefined,
                  },
                  { label: "Área", value: form.area },
                  { label: "Categoría", value: `${form.category} — ${form.subcategory}` },
                  { label: "Prioridad", value: PRIORITY_META[form.priority].label },
                  { label: "Asunto", value: form.title },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-right text-sm font-medium text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-xl bg-muted p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {form.description}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          disabled={step === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Atrás
        </Button>
        {step < 2 ? (
          <Button type="button" onClick={next} className="gap-1.5">
            Continuar
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submit} className="gap-1.5">
            <Send className="size-4" />
            Crear Solicitud
          </Button>
        )}
      </div>
    </div>
  );
}