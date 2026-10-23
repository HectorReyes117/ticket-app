import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { validateResetToken, resetPassword } from "@/features/auth/services/authService";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenValid(false);
        setValidationError("No se proporcionó ningún token de recuperación.");
        setValidating(false);
        return;
      }

      try {
        const isValid = await validateResetToken(token);
        setTokenValid(isValid);
        if (!isValid) {
          setValidationError("El enlace de recuperación es inválido, ya fue utilizado o ha expirado.");
        }
      } catch {
        setTokenValid(false);
        setValidationError("No fue posible verificar el enlace de recuperación.");
      } finally {
        setValidating(false);
      }
    }

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar la contraseña.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Requisitos visuales de contraseña
  const hasMinLen = newPassword.length >= 6;
  const hasMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">TicketApp</h2>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-0.5">
          Enterprise ITSM · Establecer Contraseña
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 sm:px-10">
          {validating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-slate-500">Verificando enlace de seguridad...</p>
            </div>
          ) : !tokenValid ? (
            /* Invalid or Expired Token */
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Enlace no válido o expirado</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {validationError || "Este enlace para restablecer contraseña ha caducado por motivos de seguridad o ya fue utilizado."}
              </p>
              <Link
                to="/forgot-password"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : success ? (
            /* Screen 4: Contraseña Actualizada con Éxito */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¡Contraseña Actualizada!</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Tu clave de acceso ha sido cambiada de forma segura. Ya puedes acceder a la plataforma con tu nueva contraseña.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition"
              >
                <span>Ir al Inicio de Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Screen 3: Formulario Establecer Nueva Contraseña */
            <>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Nueva Contraseña</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Introduce tu nueva clave de acceso institucional y confírmala para guardar los cambios.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Repite tu nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Validaciones en tiempo real */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLen ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mínimo 6 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasMatch ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ambas contraseñas coinciden</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !hasMinLen || !hasMatch}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition disabled:opacity-50"
                >
                  {loading ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <span>Actualizar Contraseña</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Cancelar y volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
