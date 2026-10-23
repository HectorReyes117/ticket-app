import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Info,
  Loader,
  LogIn,
  ShieldCheck,
  Ticket as TicketIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { validateEmail } from "@/utils";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    console.log(!validateEmail(email));
    

    if (validateEmail(email)) {
      setError("Ingresa un correo institucional válido.");
      return;
    }
    if (password.length === 0) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "No se pudo iniciar sesión. Inténtalo de nuevo.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand text-white">
            <TicketIcon className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Bienvenido de nuevo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inicia sesión en el Sistema de Solicitudes de Servicios
          </p>

          <div
            role="note"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2.5 text-left text-xs leading-relaxed text-brand-soft-fg"
          >
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
              Acceso regulado por políticas internas de TI: las cuentas son creadas y
              administradas exclusivamente por el Administrador del Sistema. Toda
              actividad es monitoreada.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="login-email">Correo institucional</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="nombre@unicaribe.edu.do"
              value={email}
              onValueChange={(value: string) => setEmail(value)}
            />
            
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Contraseña</Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-brand hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onValueChange={(value: string) => setPassword(value)}
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-priority-critical-border bg-priority-critical-bg px-3 py-2.5 text-sm text-priority-critical-fg"
            >
              <Info className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
            {submitting ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            {submitting ? "Verificando…" : "Iniciar Sesión"}
          </Button>
        </form>
      </div>
    </div>
  );
}