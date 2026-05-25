import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEdgarCompany } from "../../hooks/edgar/useEdgarCompany";
import { useEdgarCompanyFilings } from "../../hooks/edgar/useEdgarCompanyFilings";
import { useEdgarCompanyMetrics } from "../../hooks/edgar/useEdgarCompanyMetrics";
import { useStockPrice } from "../../hooks/prices/useStockPrice";
import { StockHero } from "../../components/stock/StockHero";
import { QuickAction } from "../../components/stock/QuickAction";
import { MetricasTab } from "../../components/stock/MetricasTab";
import { FilingsTab } from "../../components/stock/FilingsTab";
import { TrimestresTab } from "../../components/stock/TrimestresTab";
import { StockInfoSidebar } from "../../components/stock/StockInfoSidebar";

const TABS = ["Métricas", "Filings SEC", "Trimestres"] as const;
type Tab = (typeof TABS)[number];

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Métricas");

  const companyQuery = useEdgarCompany(ticker ?? null);
  const priceQuery = useStockPrice(ticker ?? null);
  const filingsQuery = useEdgarCompanyFilings(ticker ?? null);
  const metricsQuery = useEdgarCompanyMetrics(ticker ?? null, 8);

  const company = companyQuery.data;
  const price = priceQuery.data;
  const filings = filingsQuery.data ?? [];
  const metrics = metricsQuery.data?.metrics;

  const isLoading = companyQuery.isLoading || priceQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ fontFamily: "var(--font-body)" }}>
        <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (companyQuery.isError || !company) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4" style={{ fontFamily: "var(--font-body)" }}>
        <AlertTriangle size={32} className="text-[var(--primary)]" />
        <p className="text-[var(--text)]">
          No se encontró información para <strong>{ticker}</strong>.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-xl border border-[var(--border-strong)] px-4 py-2 text-sm text-[var(--text-muted)]"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-deep)] min-h-full" style={{ fontFamily: "var(--font-body)" }}>
      <StockHero company={company} price={price} />

      <div className="flex gap-6 p-8 items-start">
        <div className="w-56 shrink-0">
          <QuickAction company={company} price={price} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit bg-[var(--surface-2)]">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? "text-white" : "text-[var(--text-muted)]"
                }`}
                style={tab === t ? { background: "var(--gradient-brand)" } : undefined}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Métricas" && (
            <MetricasTab
              metrics={metrics}
              isLoading={metricsQuery.isLoading}
              isError={metricsQuery.isError}
              companyName={metricsQuery.data?.name}
            />
          )}

          {tab === "Filings SEC" && (
            <FilingsTab filings={filings} isLoading={filingsQuery.isLoading} />
          )}

          {tab === "Trimestres" && (
            <TrimestresTab metrics={metrics} isLoading={metricsQuery.isLoading} />
          )}
        </div>

        <StockInfoSidebar company={company} price={price} />
      </div>
    </div>
  );
}
