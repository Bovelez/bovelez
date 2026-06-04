import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { useEdgarCompany } from "../../hooks/edgar/useEdgarCompany";
import { useEdgarCompanyFilings } from "../../hooks/edgar/useEdgarCompanyFilings";
import { useEdgarCompanyMetrics } from "../../hooks/edgar/useEdgarCompanyMetrics";
import { useStockPrice } from "../../hooks/prices/useStockPrice";
import { MetricasTab } from "../../components/stock/MetricasTab";
import { FilingsTab } from "../../components/stock/FilingsTab";
import { TrimestresTab } from "../../components/stock/TrimestresTab";

const TABS = ["Métricas", "Filings", "Trimestres"] as const;
type Tab = (typeof TABS)[number];

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate   = useNavigate();
  const [tab, setTab] = useState<Tab>("Métricas");

  const companyQuery = useEdgarCompany(ticker ?? null);
  const priceQuery   = useStockPrice(ticker ?? null);
  const filingsQuery = useEdgarCompanyFilings(ticker ?? null);
  const metricsQuery = useEdgarCompanyMetrics(ticker ?? null, 8);

  const company   = companyQuery.data;
  const price     = priceQuery.data;
  const filings   = filingsQuery.data ?? [];
  const metrics   = metricsQuery.data?.metrics;
  const isLoading = companyQuery.isLoading || priceQuery.isLoading;

  if (isLoading) {
    return (
      <div data-testid="stock-loading" className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (companyQuery.isError || !company) {
    return (
      <div data-testid="stock-error" className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <AlertTriangle size={32} className="text-[var(--primary)]" />
        <p className="text-[var(--text)] text-center">No se encontró información para <strong>{ticker}</strong>.</p>
        <button data-testid="stock-back-btn" onClick={() => navigate(-1)}
          className="rounded-xl border border-[var(--border-strong)] px-5 py-3 text-sm text-[var(--text-muted)]">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div data-testid="stock-detail" className="min-h-screen bg-[var(--bg-deep)] pb-24" style={{ fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <button data-testid="stock-back-btn" onClick={() => navigate(-1)} className="p-2 rounded-xl bg-[var(--surface-2)]">
          <ArrowLeft size={18} className="text-[var(--text)]" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-base text-[var(--text)]" data-testid="stock-ticker">{company.ticker}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-2)] text-[var(--text-muted)]">S&P 500</span>
          </div>
          <p data-testid="stock-name" className="text-xs text-[var(--text-muted)] truncate">{company.name}</p>
        </div>
        {price && (
          <p data-testid="stock-price" className="font-mono font-bold text-xl text-[var(--text)]">${price.price.toFixed(2)}</p>
        )}
      </div>

      {/* CTAs */}
      <div className="flex gap-3 px-4 py-4">
        <button
          data-testid="stock-buy-btn"
          onClick={() => navigate(`/app/stock/${ticker}/buy`)}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-brand)", boxShadow: "0 4px 14px rgba(255,107,53,0.25)" }}
        >
          ↗ Comprar
        </button>
        <button
          data-testid="stock-sell-btn"
          onClick={() => navigate(`/app/stock/${ticker}/sell`)}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-rose-400 border border-rose-500/30 bg-rose-500/10"
        >
          ↙ Vender
        </button>
      </div>

      {/* Tabs */}
      <div data-testid="stock-tabs" className="flex gap-1 mx-4 p-1 rounded-xl bg-[var(--surface-2)] mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            data-testid={`stock-tab-${t.toLowerCase()}`}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "text-white" : "text-[var(--text-muted)]"}`}
            style={tab === t ? { background: "var(--gradient-brand)" } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4">
        {tab === "Métricas" && (
          <MetricasTab
            metrics={metrics}
            isLoading={metricsQuery.isLoading}
            isError={metricsQuery.isError}
            companyName={metricsQuery.data?.name}
          />
        )}
        {tab === "Filings" && (
          <FilingsTab filings={filings} isLoading={filingsQuery.isLoading} />
        )}
        {tab === "Trimestres" && (
          <TrimestresTab metrics={metrics} isLoading={metricsQuery.isLoading} />
        )}
      </div>
    </div>
  );
}
