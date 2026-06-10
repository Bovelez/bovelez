import type { ReactNode } from "react";

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
        className="block text-[13px] font-semibold text-[var(--text)] mb-1.5"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
