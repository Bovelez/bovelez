import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useRegisterForm } from '../../hooks/auth/forms/useRegisterForm';
import { AuthPageShell } from '../../components/auth/AuthPageShell';
import { FormField, inputClass } from '../../components/ui/FormField';

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
    void navigate('/app', { replace: true });
  });

  return (
    <AuthPageShell>
      <div data-testid="register-page">
        <div className="mb-7">
          <h2 className="text-[var(--text)]" style={{ fontSize: 26 }}>
            Crear cuenta
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Comenzá a invertir inteligentemente
          </p>
        </div>

        {globalError && (
          <div
            role="alert"
            data-testid="global-error"
            className="mb-4 px-4 py-3 rounded-xl text-sm border"
            style={{
              background: 'var(--danger-soft)',
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
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
              data-testid="name-input"
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
              data-testid="email-input"
              type="email"
              placeholder="juan@email.com"
              value={values.email}
              onChange={updateField}
              autoComplete="email"
              inputMode="email"
              className={inputClass(!!errors.email)}
            />
          </FormField>

          <FormField
            label="Contraseña"
            htmlFor="password"
            error={errors.password}
          >
            <div className="relative">
              <input
                id="password"
                data-testid="password-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={values.password}
                onChange={updateField}
                autoComplete="new-password"
                className={`${inputClass(!!errors.password)} pr-12`}
              />
              <button
                type="button"
                data-testid="toggle-password"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                aria-label={
                  showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
              >
                {showPass ? (
                  <EyeOff size={18} className="text-[var(--text-faint)]" />
                ) : (
                  <Eye size={18} className="text-[var(--text-faint)]" />
                )}
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
              data-testid="confirm-password-input"
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
            data-testid="submit-btn"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-semibold text-white text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'var(--gradient-brand)',
              boxShadow: '0 4px 20px rgba(255,107,53,0.25)',
            }}
          >
            {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center mt-7 text-sm text-[var(--text-muted)]">
          ¿Ya tenés cuenta?{' '}
          <button
            type="button"
            data-testid="go-to-login"
            onClick={() => navigate('/login')}
            className="font-bold text-[var(--primary)]"
          >
            Iniciar sesión →
          </button>
        </p>
      </div>
    </AuthPageShell>
  );
}
