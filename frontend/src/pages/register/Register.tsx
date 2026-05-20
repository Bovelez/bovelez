import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, TrendingUp, Check } from "lucide-react";
import { useRegisterForm } from "../../hooks/auth/forms/useRegisterForm";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { FormField, inputClass } from "../../components/ui/FormField";

// ─── Left panel content ───────────────────────────────────────────────────────

const FEATURES = [
  "Análisis de métricas SEC en tiempo real",
  "Gestión completa de tu portfolio",
  "Precios actualizados desde Yahoo Finance",
];

function RegisterLeftPanel() {
  return (
    <>
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
        {FEATURES.map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/15">
              <Check size={12} className="text-emerald-400" />
            </div>
            <span className="text-[13px] text-[var(--text-muted)]">{item}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const { values, errors, globalError, isSubmitting, updateField, handleSubmit } =
    useRegisterForm(() => {
      navigate("/app", { replace: true });
    });

  return (
    <AuthPageShell leftContent={<RegisterLeftPanel />}>
      <div data-testid="register-page">
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
            data-testid="register-error"
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
          data-testid="register-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <FormField label="Nombre completo" htmlFor="name" error={errors.name}>
            <input
              id="name"
              data-testid="register-name"
              type="text"
              placeholder="Juan Martínez"
              value={values.name}
              onChange={updateField}
              autoComplete="name"
              className={inputClass(!!errors.name)}
            />
          </FormField>

          <FormField label="Email" htmlFor="email" error={errors.email}>
            <input
              id="email"
              data-testid="register-email"
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
                data-testid="register-password"
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
                {showPass
                  ? <EyeOff size={16} className="text-[var(--text-faint)]" />
                  : <Eye size={16} className="text-[var(--text-faint)]" />}
              </button>
            </div>
          </FormField>

          <FormField
            label="Confirmar contraseña"
            htmlFor="confirmPassword"
            error={errors.confirmPassword}
          >
            <input
              id="confirmPassword"
              data-testid="register-confirm-password"
              type="password"
              placeholder="Repetir contraseña"
              value={values.confirmPassword}
              onChange={updateField}
              autoComplete="new-password"
              className={inputClass(!!errors.confirmPassword)}
            />
          </FormField>

          <button
            type="submit"
            data-testid="register-submit"
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
            data-testid="register-goto-login"
            onClick={() => navigate("/login")}
            className="font-bold text-[var(--primary)]"
          >
            Iniciar sesión →
          </button>
        </p>
      </div>
    </AuthPageShell>
  );
}
