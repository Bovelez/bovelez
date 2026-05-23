import { BarChart3, BriefcaseBusiness, Clock3 } from "lucide-react";
import { PnlBadge, PnlText } from "../ui/PnlBadge";
import type {ActiveSharesProps} from "../../types/portfolio.types";
import {useTotalPnl} from "../../hooks/portfolio/utils/useTotalPnl.ts";
import {useTotalPnlPercent} from "../../hooks/portfolio/utils/useTotalPnlPercentage.ts";
import {useMoney} from "../../hooks/portfolio/utils/useMoney.ts";
import {useNumberValue} from "../../hooks/portfolio/utils/useNumberValue.ts";

export function ActiveShares({
  portfolio,
  isLoading,
  errorMessage,
}: ActiveSharesProps) {
  const positions = portfolio?.positions ?? [];
  const pnl = useTotalPnl(positions);
  const pnlPercent = useTotalPnlPercent(positions);

  return (
    <section className="group relative overflow-hidden rounded-3xl border border-[var(--border)]/60 bg-gradient-to-b from-[var(--surface)]/80 to-[var(--bg-deep)]/90 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:shadow-emerald-500/5">
      <div className="flex flex-col gap-6 border-b border-[var(--border)]/40 bg-[var(--surface-2)]/20 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <BriefcaseBusiness size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">
              Tus Activos
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              Resumen de posiciones e histórico de ganancias en vivo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-[var(--border)]/50 bg-[var(--surface)]/50 px-4 py-3 shadow-inner backdrop-blur-md">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">
              <BarChart3 size={14} className="text-indigo-400" />
              Resultado Neto
            </p>
            <div className="mt-2 flex items-center gap-2">
              <PnlBadge value={pnl} format="currency" />
              <PnlBadge value={pnlPercent} format="percent" />
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)]/50 bg-[var(--surface)]/50 px-4 py-3 shadow-inner backdrop-blur-md">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">
              <Clock3 size={14} className="text-blue-400" />
              Última Cotización
            </p>
            <p className="mt-2 flex h-[26px] items-center text-[13px] font-medium text-[var(--text)]">
              {portfolio?.lastPriceUpdate
                ? new Date(portfolio.lastPriceUpdate).toLocaleTimeString()
                : "Sin actualizar"}
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-3 px-8 py-16 text-sm font-medium text-[var(--text-muted)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
          Sincronizando posiciones...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="m-6 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-300">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
            !
          </span>
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && positions.length === 0 && (
        <div className="flex flex-col items-center gap-4 px-8 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
            <BriefcaseBusiness size={28} opacity={0.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Aún no tienes activos
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Realiza tu primera compra en la terminal de operaciones para empezar.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !errorMessage && positions.length > 0 && (
        <div className="overflow-x-auto p-2">
          <table className="w-full border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                <th className="px-6 py-4 text-left">Activo</th>
                <th className="px-4 py-4 text-right">Tenencia</th>
                <th className="px-4 py-4 text-right">Costo Prom</th>
                <th className="px-4 py-4 text-right">Precio Actual</th>
                <th className="px-4 py-4 text-right">Capital Total</th>
                <th className="px-4 py-4 text-right">Result ($)</th>
                <th className="px-6 py-4 text-right">Result (%)</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr
                  key={position.ticker}
                  className="group bg-[var(--surface)]/30 transition-colors duration-200 hover:bg-[var(--surface-2)]/60"
                >
                  <td className="rounded-l-2xl px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-gray-700 to-gray-900 font-mono text-[11px] font-bold tracking-widest text-white shadow-md">
                        {position.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-mono text-[14px] font-bold text-[var(--text)] transition-colors group-hover:text-[var(--primary)]">
                          {position.ticker}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              position.hasPrice ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          ></span>
                          {position.hasPrice ? "Activo" : "Sin ref."}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-medium text-[var(--text)]">
                    {useNumberValue(position.quantity)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-[var(--text-muted)]">
                    {useMoney(position.avgCost)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-[var(--text)]">
                    {useMoney(position.currentPrice)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-[var(--text)]">
                    {useMoney(position.currentValue)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {position.pnl === null ? (
                      <span className="font-mono text-[var(--text-faint)]">—</span>
                    ) : (
                      <PnlText value={position.pnl} format="currency" />
                    )}
                  </td>
                  <td className="rounded-r-2xl px-6 py-4 text-right">
                    {position.pnlPercent === null ? (
                      <span className="font-mono text-[var(--text-faint)]">—</span>
                    ) : (
                      <div className="inline-flex rounded-lg bg-[var(--bg-deep)] px-2.5 py-1.5 shadow-inner">
                        <PnlText value={position.pnlPercent} format="percent" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
