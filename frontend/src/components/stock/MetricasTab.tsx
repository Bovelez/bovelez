import { FileText } from "lucide-react";
import type { EdgarMetrics, EdgarMetricPoint } from "../../types/edgar.types";

type Props = {
  metrics: EdgarMetrics["metrics"] | undefined;
  isLoading: boolean;
  isError: boolean;
  companyName?: string;
};

function formatValue(value: number, unit: string): string {
  if (unit === "USD" || unit === "USD/shares") {
    if (Math.abs(value) >= 1_000_000_000)
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(value) >= 1_000_000)
      return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  }
  if (Math.abs(value) >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toFixed(2);
}

function latestValue(points: EdgarMetricPoint[]): string {
  if (!points?.length) return "—";
  const latest = points[points.length - 1];
  return formatValue(latest.value, latest.unit);
}

function latestQuarter(points: EdgarMetricPoint[]): string {
  if (!points?.length) return "";
  return points[points.length - 1].quarter;
}

export function MetricasTab({ metrics, isLoading, isError, companyName }: Props) {
  if (isLoading) {
    return (
      <div data-cy="metricas-loading" className="col-span-2 py-12 text-center text-[var(--text-muted)]">
        Cargando métricas...
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div data-cy="metricas-error" className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
        No hay métricas financieras disponibles.
      </div>
    );
  }

  const metricCards = [
    { label: "Revenue", points: metrics.revenue },
    { label: "Net Income", points: metrics.netIncome },
    { label: "EPS", points: metrics.eps },
    { label: "Total Assets", points: metrics.totalAssets },
    { label: "Total Liabilities", points: metrics.totalLiabilities },
  ];

  return (
    <div data-cy="metricas-tab" className="grid grid-cols-2 gap-4">
      {metricCards.map(({ label, points }) => (
        <div
          key={label}
          data-cy="metric-card"
          className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-[var(--text-faint)]">
            {label}
          </p>
          <p className="font-mono font-semibold text-[var(--text)]" style={{ fontSize: 18 }}>
            {latestValue(points)}
          </p>
          {points?.length > 0 && (
            <p className="text-[11px] text-[var(--text-faint)] mt-1">
              {latestQuarter(points)}
            </p>
          )}
        </div>
      ))}

      <div
        className="col-span-2 p-4 rounded-xl flex items-center gap-3 border"
        style={{ backgroundColor: "var(--primary-soft)", borderColor: "rgba(255,107,53,0.25)" }}
      >
        <FileText size={16} className="text-[var(--primary)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">
            Datos verificados por SEC EDGAR
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Métricas financieras auditadas{companyName ? ` · ${companyName}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
