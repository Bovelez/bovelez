import { useState } from "react";
import { useNavigate } from "react-router";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Plus, RefreshCw, MoreHorizontal, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { usePortfolio } from "../../hooks/portfolio/usePortfolio";
import { useLastPriceRun } from "../../hooks/prices/useLastPriceRun";
import { useStockPrices } from "../../hooks/prices/useStockPrices";
import { useAllTransactions } from "../../hooks/transactions/useAllTransactions";
import { PnlBadge } from "../../components/ui/PnlBadge";
import { TabGroup } from "../../components/ui/TabGroup";
import { PortfolioRow } from "../../components/dashboard/PortfolioRow";
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

  const portfolioQuery = usePortfolio();
  const lastRunQuery = useLastPriceRun();
  const pricesQuery = useStockPrices();
  const transactionsQuery = useAllTransactions();

  const portfolio = portfolioQuery.data;
  const positions = portfolio?.positions ?? [];
  const pricesMap = new Map(
    (pricesQuery.data ?? []).map((p) => [p.ticker, p]),
  );

  const totalValue = portfolio?.totalValue ?? 0;
  const totalPnl = portfolio?.totalPnl ?? 0;
  const totalPnlPercent = portfolio?.totalPnlPercent ?? 0;

  const lastUpdate = lastRunQuery.data?.finishedAt
    ? new Date(lastRunQuery.data.finishedAt).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
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

  const isLoading = portfolioQuery.isLoading;

  return (
    <div
      data-testid="dashboard"
      className="p-8 text-[var(--text)] relative"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/3 w-[420px] h-[420px] rounded-full opacity-60"
        style={{ background: "var(--glow-orange)", filter: "blur(60px)" }}
      />

      {/* ── Header ── */}
      <div className="mb-6 flex items-end justify-between relative">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Panel de mi portfolio
          </p>
          <div className="flex items-end gap-3">
            <h1
              data-testid="dashboard-total-value"
              className="font-mono leading-none"
              style={{ fontSize: 38, fontWeight: 700 }}
            >
              {isLoading
                ? "···"
                : `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </h1>
            {!isLoading && (
              <>
                <PnlBadge
                  value={totalPnl}
                  format="currency"
                  className="mb-1"
                  data-testid="dashboard-pnl"
                />
                <PnlBadge
                  value={totalPnlPercent}
                  format="percent"
                  className="mb-1"
                  data-testid="dashboard-pnl-percent"
                />
              </>
            )}
          </div>
        </div>

        <div
          data-testid="dashboard-last-update"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
        >
          <RefreshCw size={12} className="text-emerald-400" />
          <span className="text-[11px] text-[var(--text-muted)]">Última actualización:</span>
          <span className="text-[11px] font-mono text-[var(--text)]">{lastUpdate}</span>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-3 gap-5 mb-6 relative">

        {/* Últimas transacciones */}
        <div
          data-testid="dashboard-recent-transactions"
          className="col-span-2 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[var(--text)]" style={{ fontSize: 16 }}>Últimas transacciones</h3>
              <p className="text-xs text-[var(--text-muted)]">Actividad reciente en tu portfolio</p>
            </div>
            <button
              onClick={() => navigate("/app/transactions")}
              className="cursor-pointer text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Ver todas →
            </button>
          </div>

          {transactionsQuery.isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-[var(--text-faint)] text-sm">Cargando…</p>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-[var(--text-faint)] text-sm">Sin transacciones aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t) => {
                const isBuy = t.type === "BUY";
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${
                        isBuy
                          ? "bg-emerald-500/85 shadow-emerald-500/20"
                          : "bg-rose-500/85 shadow-rose-500/20"
                      }`}
                    >
                      {isBuy ? (
                        <ArrowDownLeft size={14} strokeWidth={2.4} />
                      ) : (
                        <ArrowUpRight size={14} strokeWidth={2.4} />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-bold text-[var(--text)]">{t.ticker}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isBuy
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {isBuy ? "Compra" : "Venta"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-faint)]">{formatDate(t.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-[13px] font-semibold text-[var(--text)]">
                        {formatMoney(t.quantity * t.price)}
                      </p>
                      <p className="text-[11px] text-[var(--text-faint)]">{t.quantity} acciones</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Asignación */}
        <div
          data-testid="dashboard-allocation-chart"
          className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[var(--text)]" style={{ fontSize: 16 }}>Asignación</h3>
            <button className="text-[var(--text-faint)] hover:text-[var(--text)]">
              <MoreHorizontal size={16} />
            </button>
          </div>
          {allocationData.length === 0 ? (
            <div className="flex items-center justify-center h-[140px]">
              <p className="text-[var(--text-faint)] text-sm">Sin posiciones</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-2">
              <div className="w-[140px] h-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      innerRadius={48}
                      outerRadius={64}
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
                  <div key={`${s.name}-${i}`} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-[var(--text-muted)] truncate font-mono">{s.name}</span>
                    </div>
                    <span className="font-mono text-[var(--text)] font-semibold">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabla de activos ── */}
      <div
        data-testid="portfolio-table-container"
        className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
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
            className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold"
            style={{ background: "var(--gradient-brand)", boxShadow: "0 4px 14px rgba(255,107,53,0.25)" }}
          >
            <Plus size={14} /> Agregar Transacción
          </button>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-[var(--text-faint)] text-sm">Cargando portfolio…</p>
            </div>
          ) : filteredPositions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-[var(--text-faint)] text-sm">No tenés posiciones abiertas</p>
            </div>
          ) : (
            <table data-testid="portfolio-table" className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-faint)] text-[10px] uppercase tracking-widest">
                  <th className="text-left px-5 py-3 font-semibold">Nombre</th>
                  <th className="text-right px-3 py-3 font-semibold">Precio</th>
                  <th className="text-right px-3 py-3 font-semibold">24h %</th>
                  <th className="text-right px-3 py-3 font-semibold">Cantidad</th>
                  <th className="text-right px-3 py-3 font-semibold">Monto invertido</th>
                  <th className="text-right px-3 py-3 font-semibold">PPC</th>
                  <th className="text-right px-3 py-3 font-semibold">+/−</th>
                  <th className="text-right px-3 py-3 font-semibold">% G/P</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((p, i) => (
                  <PortfolioRow
                    key={p.ticker}
                    item={p}
                    dailyChangePercent={pricesMap.get(p.ticker)?.dailyChangePercent ?? null}
                    isFirst={i === 0}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
