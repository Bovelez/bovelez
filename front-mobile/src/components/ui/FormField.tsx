import type { ReactNode } from 'react';

/** Input base class — font-size kept at 16px via mobile.css to prevent iOS zoom */
export function inputClass(hasError: boolean): string {
  return [
    'w-full px-4 py-3.5 rounded-xl outline-none',
    'text-[var(--text)] bg-[var(--surface)] border',
    hasError
      ? 'border-[var(--danger)] focus:border-[var(--danger)]'
      : 'border-[var(--border)] focus:border-[var(--primary)]',
  ].join(' ');
}

interface FormFieldProps {
  label: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FormField({ label, error, htmlFor, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-[var(--text)] mb-2"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
