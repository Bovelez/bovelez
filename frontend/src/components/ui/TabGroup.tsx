interface Tab<T extends string> {
  key: T;
  label: string;
}

interface TabGroupProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
  variant?: "pill" | "surface";
  "data-testid"?: string;
}

export function TabGroup<T extends string>({
  tabs,
  active,
  onChange,
  variant = "surface",
  "data-testid": testId,
}: TabGroupProps<T>) {
  return (
    <div
      data-testid={testId}
      className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)]"
    >
      {tabs.map(({ key, label }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            data-testid={testId ? `${testId}-${key}` : undefined}
            onClick={() => onChange(key)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              isActive
                ? variant === "pill"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
            style={
              isActive && variant === "pill"
                ? { background: "var(--primary)" }
                : undefined
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
