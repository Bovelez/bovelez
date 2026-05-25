import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { EdgarMetrics, EdgarMetricPoint } from "../../types/edgar.types";

type ViewKey = "income" | "eps" | "totalAssets" | "totalLiabilities";

const VIEW_OPTIONS: { key: ViewKey; label: string }[] = [
  { key: "income", label: "Revenue / Net Income" },
  { key: "eps", label: "EPS" },
  { key: "totalAssets", label: "Total Assets" },
  { key: "totalLiabilities", label: "Total Liabilities" },
];

type Props = {
  metrics: EdgarMetrics["metrics"] | undefined;
  isLoading: boolean;
};

function toBillions(points: EdgarMetricPoint[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of points) m.set(p.quarter, parseFloat((p.value / 1_000_000_000).toFixed(2)));
  return m;
}

function buildIncomeData(
  revenue: EdgarMetricPoint[],
  netIncome: EdgarMetricPoint[],
) {
  const revMap = toBillions(revenue);
  const niMap = toBillions(netIncome);
  const quarters = Array.from(new Set([...revenue, ...netIncome].map((p) => p.quarter))).slice(-8);
  return quarters.map((q) => ({
    quarter: q,
    revenue: revMap.get(q) ?? 0,
    netIncome: niMap.get(q) ?? 0,
  }));
}

function buildSingleData(points: EdgarMetricPoint[], divideByBillions: boolean) {
  return points.slice(-8).map((p) => ({
    quarter: p.quarter,
    value: divideByBillions
      ? parseFloat((p.value / 1_000_000_000).toFixed(2))
      : parseFloat(p.value.toFixed(2)),
  }));
}

export function TrimestresTab({ metrics, isLoading }: Props) {
  const [view, setView] = useState<ViewKey>("income");

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="py-12 text-center text-[var(--text-muted)]">
          Cargando datos trimestrales...
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="py-12 text-center text-[var(--text-muted)]">
          No hay datos trimestrales disponibles.
        </div>
      </div>
    );
  }

  let chartData: Array<Record<string, string | number>> = [];
  let yFormatter: (v: number) => string;
  let tooltipFormatter: (v: number, name: string) => [string, string];

  if (view === "income") {
    chartData = buildIncomeData(metrics.revenue, metrics.netIncome);
    yFormatter = (v) => `${v}B`;
    tooltipFormatter = (v, name) => [`$${v}B`, name];
  } else if (view === "eps") {
    chartData = buildSingleData(metrics.eps, false);
    yFormatter = (v) => `$${v}`;
    tooltipFormatter = (v) => [`$${v}`, "EPS"];
  } else {
    chartData = buildSingleData(metrics[view], true);
    yFormatter = (v) => `${v}B`;
    const label = view === "totalAssets" ? "Total Assets" : "Total Liabilities";
    tooltipFormatter = (v) => [`$${v}B`, label];
  }

  const tooFewPeriods = chartData.length > 0 && chartData.length < 4;
  const selectedLabel = VIEW_OPTIONS.find((o) => o.key === view)!.label;

  return (
    <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex gap-2 mb-5 flex-wrap">
        {VIEW_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => setView(o.key)}
            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              view === o.key
                ? "text-white border-transparent"
                : "border-[var(--border-strong)] text-[var(--text-muted)] bg-[var(--bg-deep)]"
            }`}
            style={view === o.key ? { background: "var(--gradient-brand)" } : undefined}
          >
            {o.label}
          </button>
        ))}
      </div>

      {tooFewPeriods && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-[var(--primary-soft)] border border-[rgba(255,107,53,0.25)] text-[var(--primary)] text-xs">
          <AlertTriangle size={13} />
          Solo {chartData.length} período(s) disponible(s) para {selectedLabel}.
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-muted)]">
          No hay datos de {selectedLabel}.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={yFormatter} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={tooltipFormatter}
            />
            {view === "income" ? (
              <>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" fill="var(--primary)" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netIncome" fill="#10B981" name="Net Income" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <Bar
                dataKey="value"
                fill="var(--primary)"
                name={selectedLabel}
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}

      <p className="text-[11px] text-[var(--text-faint)] mt-3 text-right">
        Datos XBRL Company Facts · últimos {chartData.length} quarters reportados
      </p>
    </div>
  );
}
