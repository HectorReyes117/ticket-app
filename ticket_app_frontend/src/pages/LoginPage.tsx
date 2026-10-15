import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ClipboardCheck,
  ShieldCheck,
  Ticket as TicketIcon,
  Zap,
} from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/context/auth-context";

const FEATURES = [
  {
    icon: Zap,
    title: "Atención con SLA",
    description: "Cada solicitud tiene una ventana de respuesta según su prioridad.",
  },
  {
    icon: Bell,
    title: "Notificaciones en tiempo real",
    description: "Sigue el avance de tus solicitudes sin perder detalle.",
  },
  {
    icon: ClipboardCheck,
    title: "Seguimiento transparente",
    description: "Consulta el historial completo y las notas del equipo de soporte.",
  },
];

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand p-10 text-white lg:flex">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
            <TicketIcon className="size-5" />
          </span>
          <span className="text-lg font-semibold">TicketApp</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            Gestión de solicitudes de servicio para instituciones educativas
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Registra, asigna y resuelve solicitudes técnicas desde un solo lugar,
            con priorización automática por SLA y seguimiento transparente.
          </p>
          <ul className="mt-10 space-y-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="size-4.5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{feature.title}</span>
                    <span className="mt-0.5 block text-sm text-white/70">
                      {feature.description}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-sm text-white/70">
          <ShieldCheck className="size-4" />
          Universidad Caribe · Dirección de Tecnología de la Información
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-10">
        <LoginForm />
      </div>
    </div>
  );
}