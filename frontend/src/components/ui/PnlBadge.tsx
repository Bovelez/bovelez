interface PnlBadgeProps {
  value: number;
  format?: "currency" | "percent";
  className?: string;
  "data-testid"?: string;
}


export function PnlBadge({
  value,
  format = "currency",
  className = "",
  "data-testid": testId,
}: PnlBadgeProps) {
  const isPos = value >= 0;
  const sign = isPos ? "+" : "";
  const colorClass = isPos
    ? "bg-emerald-500/15 text-emerald-400"
    : "bg-rose-500/15 text-rose-400";

  const display =
    format === "currency"
      ? `${sign}$${Math.abs(value).toFixed(2)}`
      : `${sign}${value.toFixed(2)}%`;

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-semibold ${colorClass} ${className}`}
    >
      {display}
    </span>
  );
}

export function PnlText({
  value,
  format = "currency",
  className = "",
  "data-testid": testId,
}: PnlBadgeProps) {
  const isPos = value >= 0;
  const sign = isPos ? "+" : "";
  const colorClass = isPos ? "text-emerald-400" : "text-rose-400";

  const display =
    format === "currency"
      ? `${sign}$${Math.abs(value).toFixed(2)}`
      : `${sign}${value.toFixed(2)}%`;

  return (
    <span
      data-testid={testId}
      className={`font-mono font-semibold ${colorClass} ${className}`}
    >
      {display}
    </span>
  );
}
