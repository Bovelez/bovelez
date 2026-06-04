import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { portfolio } from "../../data/mockData";
import { useApp } from "../../context/AppContext";
import { PnlBadge } from "../../components/ui/PnlBadge";

export default function Dashboard() {
  const { lastPriceUpdate } = useApp();

  const totalValue   = portfolio.reduce((s, p) => s + p.quantity * p.currentPrice, 0);
  const totalCost    = portfolio.reduce((s, p) => s + p.quantity * p.avgPrice, 0);
  const totalPnl     = totalValue - totalCost;
  const pnlPercent   = (totalPnl / totalCost) * 100;

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
          ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
          <span className="text-[11px] font-mono text-[var(--text)]">{lastPriceUpdate}</span>
        </div>
      </div>

      {/* ── Positions list ── */}
      <div
        data-testid="portfolio-table-container"
        className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)]">Posiciones</h2>
        </div>

        <div data-testid="portfolio-table" className="divide-y divide-[var(--border)]">
          {portfolio.map((p) => {
            const pnl = (p.currentPrice - p.avgPrice) * p.quantity;
            const pct = ((p.currentPrice - p.avgPrice) / p.avgPrice) * 100;
            const isPos = pnl >= 0;

            return (
              <div
                key={p.ticker}
                data-testid={`portfolio-row-${p.ticker}`}
                className="px-4 py-3.5 flex items-center justify-between"
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
                    ${p.currentPrice.toFixed(2)}
                  </p>
                  <span
                    data-testid={`portfolio-row-${p.ticker}-pct`}
                    className={`font-mono text-xs font-semibold ${isPos ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {isPos ? "+" : ""}{pct.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
