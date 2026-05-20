import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useLoginForm } from "../../hooks/auth/forms/useLoginForm";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);

  const {
    values,
    errors,
    globalError,
    isSubmitting,
    updateField,
    handleSubmit,
  } = useLoginForm(() => {
    const from =
      (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname || "/app";
    navigate(from, { replace: true });
  });

  return (
    <div
      className="flex h-screen bg-[var(--bg-deep)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Left panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-5/12 p-12 relative overflow-hidden bg-[var(--bg)]">
        <div
          className="absolute pointer-events-none rounded-full top-[15%] left-[15%] w-[320px] h-[320px] opacity-70"
          style={{ background: "var(--glow-orange)", filter: "blur(60px)" }}
        />
        <div className="relative text-center">
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
          <p
            className="text-[var(--text)] mt-3 font-semibold"
            style={{ fontSize: 15 }}
          >
            Accedé a tu portfolio
          </p>
          <p className="text-[var(--text-muted)] mt-1.5 text-[13px]">
            Datos reales. Decisiones inteligentes.
          </p>

          <div className="mt-12 p-5 rounded-2xl text-left space-y-3 bg-[var(--surface)] border border-[var(--border)]">
            <Row label="Portfolio Total" value="$45,320.50" />
            <Row
              label="Ganancia total"
              value="+$3,245.20"
              valueClass="text-emerald-400"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-muted)]">
                Rendimiento
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
                +7.7%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--bg-deep)]">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-[var(--text)]" style={{ fontSize: 28 }}>
              Iniciar sesión
            </h2>
            <p className="text-[var(--text-muted)] text-[13px] mt-1">
              Bienvenido de vuelta
            </p>
          </div>

          {globalError && (
            <div
              role="alert"
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Email" error={errors.email}>
              <input
                id="email"
                type="email"
                placeholder="juan@email.com"
                value={values.email}
                onChange={updateField}
                autoComplete="email"
                className={inputClass(!!errors.email)}
              />
            </Field>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[13px] font-semibold text-[var(--text)]"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
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
                  {showPass ? (
                    <EyeOff size={16} className="text-[var(--text-faint)]" />
                  ) : (
                    <Eye size={16} className="text-[var(--text-faint)]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-[var(--danger)]">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
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
              onClick={() => navigate("/register")}
              className="font-bold text-[var(--primary)]"
            >
              Registrarse →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full px-4 py-2.5 rounded-lg outline-none text-[13px]",
    "text-[var(--text)] bg-[var(--surface)] border",
    hasError
      ? "border-[var(--danger)] focus:border-[var(--danger)]"
      : "border-[var(--border)] focus:border-[var(--primary)]",
  ].join(" ");
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span
        className={`text-[13px] font-bold font-mono ${valueClass || "text-[var(--text)]"}`}
      >
        {value}
      </span>
    </div>
  );
}
