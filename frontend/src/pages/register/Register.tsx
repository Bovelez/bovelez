import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, TrendingUp, Check } from "lucide-react";
import { useRegisterForm } from "../../hooks/auth/forms/useRegisterForm";

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const {
    values,
    errors,
    globalError,
    isSubmitting,
    updateField,
    handleSubmit,
  } = useRegisterForm(() => {
    navigate("/app", { replace: true });
  });

  return (
    <div
      className="flex h-screen bg-[var(--bg-deep)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Left panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-5/12 p-12 relative overflow-hidden bg-[var(--bg)]">
        <div
          className="absolute pointer-events-none rounded-full top-[20%] left-[15%] w-[320px] h-[320px] opacity-70"
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
            className="italic bg-clip-text text-transparent"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 42,
              lineHeight: 1.1,
              backgroundImage: "var(--gradient-brand)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            VIPJM
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2">Tracker</p>

          <div className="mt-10 space-y-3 text-left">
            {[
              "Análisis de métricas SEC en tiempo real",
              "Gestión completa de tu portfolio",
              "Precios actualizados desde Yahoo Finance",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/15">
                  <Check size={12} className="text-emerald-400" />
                </div>
                <span className="text-[13px] text-[var(--text-muted)]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--bg-deep)]">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-[var(--text)]" style={{ fontSize: 28 }}>
              Crear cuenta
            </h2>
            <p className="text-[var(--text-muted)] text-[13px] mt-1">
              Comenzá a invertir inteligentemente
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
            <Field label="Nombre completo" error={errors.name}>
              <input
                id="name"
                type="text"
                placeholder="Juan Martínez"
                value={values.name}
                onChange={updateField}
                autoComplete="name"
                className={inputClass(!!errors.name)}
              />
            </Field>

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
              <label
                htmlFor="password"
                className="block text-[13px] font-semibold text-[var(--text)] mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={values.password}
                  onChange={updateField}
                  autoComplete="new-password"
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

            <Field
              label="Confirmar contraseña"
              error={errors.confirmPassword}
            >
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repetir contraseña"
                value={values.confirmPassword}
                onChange={updateField}
                autoComplete="new-password"
                className={inputClass(!!errors.confirmPassword)}
              />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold text-white mt-2 text-[13px] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "var(--gradient-brand)",
                boxShadow: "0 4px 14px rgba(255,107,53,0.25)",
              }}
            >
              {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center mt-6 text-[13px] text-[var(--text-muted)]">
            ¿Ya tenés cuenta?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-bold text-[var(--primary)]"
            >
              Iniciar sesión →
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
