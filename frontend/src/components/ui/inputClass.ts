export function inputClass(hasError: boolean): string {
  return [
    "w-full px-4 py-2.5 rounded-lg outline-none text-[13px]",
    "text-[var(--text)] bg-[var(--surface)] border",
    hasError
      ? "border-[var(--danger)] focus:border-[var(--danger)]"
      : "border-[var(--border)] focus:border-[var(--primary)]",
  ].join(" ");
}
