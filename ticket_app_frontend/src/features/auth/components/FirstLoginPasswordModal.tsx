import { useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { changeInitialPassword } from "@/features/auth/services/authService";
import { useAuth } from "@/context/auth-context";

interface FirstLoginPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export function FirstLoginPasswordModal({ isOpen, onSuccess }: FirstLoginPasswordModalProps) {
  const { user, updateUserSession, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  // Criterios de validación de seguridad
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch && currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError("Por favor cumple con todos los requisitos de seguridad antes de continuar.");
      return;
    }

    try {
      setSubmitting(true);
      await changeInitialPassword(currentPassword, newPassword, confirmPassword);
      
      updateUserSession({ mustChangePassword: false });
      
      toast.add({
        title: "Contraseña actualizada",
        description: "Tu contraseña permanente ha sido guardada exitosamente.",
        type: "success",
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al actualizar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
        {/* Encabezado con Icono y Alerta */}
        <div className="flex flex-col gap-2 text-center items-center">
          <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-xs">
            <KeyRound className="size-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Establecer Contraseña Permanente
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            Bienvenido, <strong className="text-foreground">{user.name}</strong>. Has ingresado con una clave provisional. Por políticas de ciberseguridad institucional, debes definir tu contraseña definitiva para continuar.
          </p>
        </div>

        {/* Alerta de Norma de Seguridad */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="leading-snug">
            Esta contraseña será requerida en todos tus futuros inicios de sesión en TicketApp.
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Contraseña Temporal / Actual */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-temp-password" className="text-xs font-semibold text-foreground">
              Contraseña Temporal Provista
            </Label>
            <div className="relative">
              <Input
                id="current-temp-password"
                type={showCurrent ? "text" : "password"}
                placeholder="Pega aquí la clave que recibiste por correo"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10 text-xs rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password" className="text-xs font-semibold text-foreground">
              Nueva Contraseña Permanente
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                placeholder="Mínimo 8 caracteres seguros"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 text-xs rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-new-password" className="text-xs font-semibold text-foreground">
              Confirmar Nueva Contraseña
            </Label>
            <div className="relative">
              <Input
                id="confirm-new-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 text-xs rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Checklist de Requisitos de Seguridad */}
          <div className="bg-muted/40 rounded-xl p-3 border border-border flex flex-col gap-1.5 text-[11px]">
            <span className="font-semibold text-foreground mb-1">Requisitos de contraseña:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <span className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                <Check className={`size-3.5 ${hasMinLength ? "stroke-[3]" : "opacity-30"}`} />
                Mínimo 8 caracteres
              </span>
              <span className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                <Check className={`size-3.5 ${hasUpper ? "stroke-[3]" : "opacity-30"}`} />
                Una letra mayúscula
              </span>
              <span className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                <Check className={`size-3.5 ${hasLower ? "stroke-[3]" : "opacity-30"}`} />
                Una letra minúscula
              </span>
              <span className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                <Check className={`size-3.5 ${hasNumber ? "stroke-[3]" : "opacity-30"}`} />
                Al menos un número
              </span>
              <span className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                <Check className={`size-3.5 ${hasSpecial ? "stroke-[3]" : "opacity-30"}`} />
                Carácter especial (@, #, !, etc.)
              </span>
              <span className={`flex items-center gap-1.5 ${passwordsMatch ? "text-emerald-600 font-semibold" : "text-muted-foreground"}`}>
                <Check className={`size-3.5 ${passwordsMatch ? "stroke-[3]" : "opacity-30"}`} />
                Las contraseñas coinciden
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-xl border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-destructive w-full sm:w-auto"
            >
              Cerrar sesión
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={submitting || !isValid}
              className="gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl px-5 py-2.5 w-full sm:w-auto shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  <span>Guardar Contraseña y Continuar</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
