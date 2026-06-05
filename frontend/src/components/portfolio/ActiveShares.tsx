import { useState } from "react";
import { ArrowUpRight, BarChart3, BriefcaseBusiness, Clock3, History, TrendingUp, TrendingDown } from "lucide-react";
import { PnlBadge, PnlText } from "../ui/PnlBadge";
import { TickerTransactionsDialog } from "../transactions/TickerTransactionsDialog";
import type { ActiveSharesProps } from "../../types/portfolio.types";
import { useFormatNumber } from "../../hooks/transactions/utils/useFormatNumber.ts";
import { useMoney } from "../../hooks/transactions/utils/useMoney.ts";

export function ActiveShares({ portfolio, isLoading, errorMessage }: ActiveSharesProps) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const positions = portfolio?.positions ?? [];
  const pnl = portfolio?.totalPnl ?? 0;
  const pnlPercent = portfolio?.totalPnlPercent ?? 0;
  const selectedPosition = selectedTicker
      ? positions.find((p) => p.ticker === selectedTicker) ?? null
      : null;
  const tableHeaders = [
    { label: "Ticker", className: "text-center" },
    { label: "Cantidad", className: "text-center" },
    { label: "Costo Promedio", className: "text-center" },
    { label: "Precio Actual", className: "text-center" },
    { label: "Costos totales", className: "text-center" },
    { label: "PNL", className: "text-center" },
    { label: "PNL%", className: "text-center" },
    { label: "Acciones", className: "text-center" },
  ];

  return (
      <section data-cy="active-shares" className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--surface)]/60 shadow-2xl backdrop-blur-xl">

        {/* Header */}
        <div className="flex flex-col gap-5 border-b border-white/[0.05] bg-[var(--surface-2)]/30 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <BriefcaseBusiness size={22} strokeWidth={1.8} className="text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-black tracking-tight text-[var(--text)]">Tus Activos</h2>
              <p className="mt-0.5 text-xs font-semibold text-white/85">
                Posiciones activas · rendimiento en tiempo real
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[var(--bg-deep)]/60 px-4 py-2.5">
              <BarChart3 size={15} className="shrink-0 text-indigo-400" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-100/80">Resultado Neto</p>
                <div className="mt-1 flex items-center gap-2">
                  <PnlBadge value={pnl} format="currency" />
                  <PnlBadge value={pnlPercent} format="percent" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[var(--bg-deep)]/60 px-4 py-2.5">
              <Clock3 size={15} className="shrink-0 text-blue-400" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-100/80">Última Cotización</p>
                <p className="mt-1 text-[13px] font-semibold text-[var(--text)]">
                  {portfolio?.lastPriceUpdate
                      ? new Date(portfolio.lastPriceUpdate).toLocaleTimeString()
                      : "Sin actualizar"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
            <div data-cy="active-shares-loading" className="flex flex-col items-center gap-3 px-8 py-16 text-sm font-semibold text-[var(--text-muted)]">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              Sincronizando posiciones…
            </div>
        )}

        {/* Error */}
        {!isLoading && errorMessage && (
            <div data-cy="active-shares-error" className="m-6 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.08] px-5 py-4 text-sm text-rose-300">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-xs font-black text-rose-400">!</span>
              {errorMessage}
            </div>
        )}

        {/* Empty */}
        {!isLoading && !errorMessage && positions.length === 0 && (
            <div data-cy="active-shares-empty" className="flex flex-col items-center gap-4 px-8 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                <BriefcaseBusiness size={28} opacity={0.4} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Sin posiciones abiertas</h3>
                <p className="mt-1 text-sm font-semibold text-white/80">
                  Usá el terminal de operaciones para realizar tu primera compra.
                </p>
              </div>
            </div>
        )}

        {/* Table */}
        {!isLoading && !errorMessage && positions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                <tr className="border-b border-white/[0.04]">
                  {tableHeaders.map(({ label, className }, i) => (
                      <th
                          key={i}
                          className={`px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.18em] text-orange-100/85 ${className}`}
                      >
                        {label}
                      </th>
                  ))}
                </tr>
                </thead>
                <tbody>
                {positions.map((position) => {
                  const isPositive = (position.pnl ?? 0) >= 0;
                  const totalCost = position.avgCost * position.quantity;
                  return (
                      <tr
                          key={position.ticker}
                          data-cy="position-row"
                          data-ticker={position.ticker}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedTicker(position.ticker)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedTicker(position.ticker);
                            }
                          }}
                          className="group cursor-pointer border-b border-white/[0.03] transition-colors duration-150 last:border-0 hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-none"
                      >
                        {/* Ticker cell */}
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-3.5 text-left">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-[var(--surface-2)] to-[var(--bg-deep)] font-mono text-[11px] font-black tracking-wider text-[var(--text)]">
                              {position.ticker.slice(0, 3)}
                            </div>
                            <div>
                              <p data-cy="position-ticker" className="font-mono text-[14px] font-black text-[var(--text)] transition-colors group-hover:text-orange-400">
                                {position.ticker}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${position.hasPrice ? "bg-emerald-500" : "bg-rose-500"}`} />
                                <span className="text-[10px] font-semibold text-white/75">
                              {position.hasPrice ? "Activo" : "Sin ref."}
                            </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td data-cy="position-quantity" className="px-5 py-4 text-center font-mono text-[14px] font-semibold text-[var(--text)]">
                          {useFormatNumber(position.quantity)}
                        </td>
                        <td data-cy="position-avg-cost" className="px-5 py-4 text-center font-mono text-[13px] font-semibold text-white/85">
                          {useMoney(position.avgCost)}
                        </td>
                        <td data-cy="position-current-price" className="px-5 py-4 text-center font-mono text-[14px] font-semibold text-[var(--text)]">
                          {useMoney(position.currentPrice)}
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-[14px] font-black text-[var(--text)]">
                          {useMoney(totalCost)}
                        </td>
                        <td data-cy="position-pnl" className="px-5 py-4 text-center">
                          {position.pnl === null ? (
                              <span className="font-mono font-semibold text-white/70">—</span>
                          ) : (
                              <PnlText value={position.pnl} format="currency" />
                          )}
                        </td>
                        <td data-cy="position-pnl-percent" className="px-5 py-4 text-center">
                          {position.pnlPercent === null ? (
                              <span className="font-mono font-semibold text-white/70">—</span>
                          ) : (
                              <span
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-[12px] font-bold"
                                  style={{
                                    background: isPositive ? "rgba(52,211,153,0.08)" : "rgba(251,113,133,0.08)",
                                  }}
                              >
                          {isPositive
                              ? <TrendingUp size={11} className="text-emerald-400" />
                              : <TrendingDown size={11} className="text-rose-400" />}
                                <PnlText value={position.pnlPercent} format="percent" />
                        </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-[var(--bg-deep)]/60 text-[var(--text-faint)] transition-all group-hover:border-orange-500/30 group-hover:text-orange-400">
                              <History size={14} strokeWidth={2.2} />
                            </span>
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/[0.08] text-rose-200 transition-all group-hover:border-rose-400/40 group-hover:text-rose-100">
                              <ArrowUpRight size={14} strokeWidth={2.2} />
                            </span>
                          </div>
                        </td>
                      </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
        )}

        <TickerTransactionsDialog
            open={Boolean(selectedPosition)}
            position={selectedPosition}
            onOpenChange={(open) => { if (!open) setSelectedTicker(null); }}
        />
      </section>
  );
}
