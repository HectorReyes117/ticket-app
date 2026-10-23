import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/features/auth/services/authService";
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Mail,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Lock,
} from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Por favor ingresa tu correo institucional.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la solicitud.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">TicketApp</h2>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-0.5">
          Enterprise ITSM · Seguridad e Identidad
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 sm:px-10">
          {!submitted ? (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Recuperar Contraseña</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Ingresa tu correo institucional registrado y te enviaremos un enlace de un solo uso para restablecer tu clave.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Institucional
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="nombre.apellido@unicaribe.edu.do"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 flex items-start gap-2 text-amber-900 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    Por políticas de seguridad, el enlace generado tendrá una validez de <strong>2 horas</strong>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition disabled:opacity-50"
                >
                  {loading ? (
                    <span>Procesando...</span>
                  ) : (
                    <>
                      <span>Enviar enlace de recuperación</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Screen 2: Correo Enviado */
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¡Correo Enviado!</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Hemos enviado un correo a <strong className="text-slate-900 font-semibold">{email}</strong> con las instrucciones y el botón para restablecer tu contraseña.
              </p>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-left mb-6">
                💡 Si no visualizas el mensaje en tu bandeja principal, verifica la carpeta de <em>Spam</em> o <em>Correo no deseado</em>.
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold mb-3 block mx-auto"
              >
                ¿No recibiste el correo? Intentar nuevamente
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al inicio de sesión</span>
            </Link>
          </div>
        </div>

        {/* Footer Support */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 inline-flex items-center gap-1">
            <Headphones className="w-3.5 h-3.5" />
            ¿Problemas con tu cuenta? Contacta a la Mesa de Ayuda TI
          </p>
        </div>
      </div>
    </div>
  );
}
