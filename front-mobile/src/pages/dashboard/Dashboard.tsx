import { useState } from "react";
import { useNavigate } from "react-router";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { RefreshCw, ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { usePortfolio } from "../../hooks/portfolio/usePortfolio";
import { useLastPriceRun } from "../../hooks/prices/useLastPriceRun";
import { useAllTransactions } from "../../hooks/transactions/useAllTransactions";
import { PnlBadge, PnlText } from "../../components/ui/PnlBadge";
import { TabGroup } from "../../components/ui/TabGroup";
import { useMoney } from "../../hooks/transactions/utils/useMoney";
import { formatMoney, formatDate, byDateDesc } from "../transactions/transactions.utils";

const ASSET_TABS = [
  { key: "todo",     label: "Todo"     },
  { key: "acciones", label: "Acciones" },
] as const;
type AssetTab = (typeof ASSET_TABS)[number]["key"];

const PIE_COLORS = ["var(--primary)", "#F08A3C", "#F472B6", "#A855F7", "#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AssetTab>("todo");

  const portfolioQuery      = usePortfolio();
  const lastPriceRunQuery   = useLastPriceRun();
  const transactionsQuery   = useAllTransactions();

  const totalValue  = portfolioQuery.data?.totalValue ?? 0;
  const totalPnl    = portfolioQuery.data?.totalPnl ?? 0;
  const pnlPercent  = portfolioQuery.data?.totalPnlPercent ?? 0;
  const positions   = portfolioQuery.data?.positions ?? [];
  const isLoading   = portfolioQuery.isLoading;

  const lastUpdate = lastPriceRunQuery.data?.finishedAt
    ? new Date(lastPriceRunQuery.data.finishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  const filteredPositions = positions.filter(() => tab === "todo" || tab === "acciones");

  const recentTransactions = [...(transactionsQuery.data ?? [])]
    .sort(byDateDesc)
    .slice(0, 5);

  const allocationData = positions
    .filter((p) => p.currentValue != null && p.currentValue > 0)
    .sort((a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0))
    .slice(0, 4)
    .map((p) => ({
      name: p.ticker,
      value: Math.round(((p.currentValue ?? 0) / (totalValue || 1)) * 100),
    }));

  return (
    <div
      data-testid="dashboard"
      className="p-4 text-[var(--text)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── Summary card ── */}
      <div
        data-testid="dashboard-summary"
        className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 mb-4"
      >
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Panel de mi portfolio
        </p>
        <p
          data-testid="dashboard-total-value"
          className="font-mono text-3xl font-bold leading-none mb-3"
        >
          {isLoading ? "···" : `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        </p>
        <div className="flex gap-2 flex-wrap">
          <PnlBadge value={totalPnl} format="currency" data-testid="dashboard-pnl" />
          <PnlBadge value={pnlPercent} format="percent" data-testid="dashboard-pnl-percent" />
        </div>
        <div
          data-testid="dashboard-last-update"
          className="flex items-center gap-1.5 mt-4 border-t border-[var(--border)] pt-3"
        >
          <RefreshCw size={11} className="text-emerald-400" />
          <span className="text-[11px] text-[var(--text-muted)]">Última actualización:</span>
          <span className="text-[11px] font-mono text-[var(--text)]">{lastUpdate}</span>
        </div>
      </div>

      {/* ── Asignación ── */}
      {allocationData.length > 0 && (
        <div
          data-testid="dashboard-allocation-chart"
          className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 mb-4"
        >
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Asignación</h2>
          <div className="flex items-center gap-4">
            <div className="w-[110px] h-[110px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    innerRadius={36}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {allocationData.map((s, i) => (
                      <Cell key={`${s.name}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {allocationData.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="font-mono text-[var(--text-muted)]">{s.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-[var(--text)]">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Últimas transacciones ── */}
      <div
        data-testid="dashboard-recent-transactions"
        className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Últimas transacciones</h2>
          <button
            onClick={() => navigate("/app/transactions")}
            className="text-[11px] text-[var(--text-muted)]"
          >
            Ver todas →
          </button>
        </div>

        {transactionsQuery.isLoading ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">Cargando…</p>
        ) : recentTransactions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">Sin transacciones aún</p>
        ) : (
          <div className="space-y-1">
            {recentTransactions.map((t) => {
              const isBuy = t.type === "BUY";
              return (
                <div key={t.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${
                      isBuy ? "bg-emerald-500/85" : "bg-rose-500/85"
                    }`}
                  >
                    {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-bold text-[var(--text)]">{t.ticker}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isBuy ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                        {isBuy ? "Compra" : "Venta"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">{formatDate(t.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[13px] font-semibold text-[var(--text)]">{formatMoney(t.quantity * t.price)}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{t.quantity} acc.</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Posiciones ── */}
      <div
        data-testid="portfolio-table-container"
        className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <TabGroup
            tabs={ASSET_TABS as unknown as { key: AssetTab; label: string }[]}
            active={tab}
            onChange={(k) => setTab(k as AssetTab)}
            variant="surface"
            data-testid="dashboard-asset-tabs"
          />
          <button
            data-testid="dashboard-add-transaction"
            onClick={() => navigate("/app/portfolio")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Plus size={12} /> Nueva
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--text-muted)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Cargando…
          </div>
        )}

        {!isLoading && filteredPositions.length === 0 && (
          <p className="text-center py-10 text-sm text-[var(--text-muted)]">Sin posiciones abiertas.</p>
        )}

        <div data-testid="portfolio-table" className="divide-y divide-[var(--border)]">
          {filteredPositions.map((p) => (
            <div
              key={p.ticker}
              data-testid={`portfolio-row-${p.ticker}`}
              onClick={() => navigate(`/app/stock/${p.ticker}`)}
              className="px-4 py-3.5 flex items-center justify-between cursor-pointer active:bg-[var(--surface-2)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px] font-bold text-[var(--primary)] shrink-0">
                  {p.ticker.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{p.ticker}</p>
                  <p className="text-xs text-[var(--text-muted)]">{p.quantity} acc.</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  data-testid={`portfolio-row-${p.ticker}-price`}
                  className="font-mono text-sm font-semibold text-[var(--text)]"
                >
                  {useMoney(p.currentPrice)}
                </p>
                {p.pnlPercent !== null ? (
                  <PnlText value={p.pnlPercent} format="percent" data-testid={`portfolio-row-${p.ticker}-pct`} />
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
