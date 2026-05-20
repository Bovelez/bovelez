import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useLoginForm } from "../../hooks/auth/forms/useLoginForm";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { FormField, inputClass } from "../../components/ui/FormField";

// ─── Left panel content ───────────────────────────────────────────────────────

function LoginLeftPanel() {
  return (
    <>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[var(--border-strong)]"
        style={{ background: "var(--gradient-brand-soft)" }}
      >
        <TrendingUp size={28} className="text-[var(--primary)]" />
      </div>

      <h1
        className="italic bg-clip-text text-transparent leading-none"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 48,
          backgroundImage: "var(--gradient-brand)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        VIPJM
      </h1>
      <p className="text-[var(--text)] mt-3 font-semibold" style={{ fontSize: 15 }}>
        Accedé a tu portfolio
      </p>
      <p className="text-[var(--text-muted)] mt-1.5 text-[13px]">
        Datos reales. Decisiones inteligentes.
      </p>

      <div className="mt-12 p-5 rounded-2xl text-left space-y-3 bg-[var(--surface)] border border-[var(--border)]">
        <StatRow label="Portfolio Total" value="$45,320.50" />
        <StatRow label="Ganancia total" value="+$3,245.20" valueClass="text-emerald-400" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--text-muted)]">Rendimiento</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
            +7.7%
          </span>
        </div>
      </div>
    </>
  );
}

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className={`text-[13px] font-bold font-mono ${valueClass ?? "text-[var(--text)]"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);

  const { values, errors, globalError, isSubmitting, updateField, handleSubmit } =
    useLoginForm(() => {
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/app";
      navigate(from, { replace: true });
    });

  return (
    <AuthPageShell leftContent={<LoginLeftPanel />}>
      <div data-testid="login-page">
        <div className="mb-8">
          <h2 className="text-[var(--text)]" style={{ fontSize: 28 }}>
            Iniciar sesión
          </h2>
          <p className="text-[var(--text-muted)] text-[13px] mt-1">Bienvenido de vuelta</p>
        </div>

        {globalError && (
          <div
            role="alert"
            data-testid="login-error"
            className="mb-4 px-3 py-2 rounded-lg text-[13px] border"
            style={{
              background: "var(--danger-soft)",
              borderColor: "var(--danger)",
              color: "var(--danger)",
            }}
          >
            {globalError}
          </div>
        )}

        <form
          data-testid="login-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <FormField label="Email" htmlFor="email" error={errors.email}>
            <input
              id="email"
              data-testid="login-email"
              type="email"
              placeholder="juan@email.com"
              value={values.email}
              onChange={updateField}
              autoComplete="email"
              className={inputClass(!!errors.email)}
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="password" error={errors.password}>
            <div className="relative">
              <input
                id="password"
                data-testid="login-password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={values.password}
                onChange={updateField}
                autoComplete="current-password"
                className={`${inputClass(!!errors.password)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass
                  ? <EyeOff size={16} className="text-[var(--text-faint)]" />
                  : <Eye size={16} className="text-[var(--text-faint)]" />}
              </button>
            </div>
          </FormField>

          <button
            type="submit"
            data-testid="login-submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg font-semibold text-white text-[13px] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "var(--gradient-brand)",
              boxShadow: "0 4px 14px rgba(255,107,53,0.25)",
            }}
          >
            {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center mt-6 text-[13px] text-[var(--text-muted)]">
          ¿No tenés cuenta?{" "}
          <button
            type="button"
            data-testid="login-goto-register"
            onClick={() => navigate("/register")}
            className="font-bold text-[var(--primary)]"
          >
            Registrarse →
          </button>
        </p>
      </div>
    </AuthPageShell>
  );
}
