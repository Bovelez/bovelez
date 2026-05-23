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
    <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[17px] text-[var(--text)]">Acciones activas</h2>
          <p className="text-[12px] text-[var(--text-muted)]">
            Posiciones abiertas calculadas desde tus compras y ventas.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
              <BriefcaseBusiness size={12} />
              Valor
            </p>
            <p className="mt-1 font-mono text-[15px] font-bold text-[var(--text)]">
              {useMoney(portfolio?.totalValue)}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
              <BarChart3 size={12} />
              Resultado
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <PnlBadge value={pnl} format="currency" />
              <PnlBadge value={pnlPercent} format="percent" />
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
              <Clock3 size={12} />
              Precios
            </p>
            <p className="mt-1 truncate text-[12px] text-[var(--text-muted)]">
              {portfolio?.lastPriceUpdate
                ? new Date(portfolio.lastPriceUpdate).toLocaleString()
                : "sin actualizar"}
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="px-5 py-8 text-[13px] text-[var(--text-muted)]">
          Cargando posiciones...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="px-5 py-8 text-[13px] text-rose-300">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && positions.length === 0 && (
        <div className="px-5 py-8 text-[13px] text-[var(--text-muted)]">
          Todavía no tenés acciones activas. Registrá una compra para verla acá.
        </div>
      )}

      {!isLoading && !errorMessage && positions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
                <th className="px-5 py-3 text-left font-semibold">Ticker</th>
                <th className="px-3 py-3 text-right font-semibold">Cantidad</th>
                <th className="px-3 py-3 text-right font-semibold">PPC</th>
                <th className="px-3 py-3 text-right font-semibold">Precio</th>
                <th className="px-3 py-3 text-right font-semibold">Valor</th>
                <th className="px-3 py-3 text-right font-semibold">G/P</th>
                <th className="px-5 py-3 text-right font-semibold">% G/P</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => (
                <tr
                  key={position.ticker}
                  className="hover:bg-[var(--surface-2)]"
                  style={{
                    borderTop: index === 0 ? "none" : "1px solid var(--border)",
                  }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[11px] font-bold text-[var(--primary)]">
                        {position.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-mono text-[13px] font-bold text-[var(--text)]">
                          {position.ticker}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {position.hasPrice ? "con precio" : "sin precio"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 text-right font-mono text-[var(--text)]">
                    {useNumberValue(position.quantity)}
                  </td>
                  <td className="px-3 text-right font-mono text-[var(--text-muted)]">
                    {useMoney(position.avgCost)}
                  </td>
                  <td className="px-3 text-right font-mono text-[var(--text)]">
                    {useMoney(position.currentPrice)}
                  </td>
                  <td className="px-3 text-right font-mono font-semibold text-[var(--text)]">
                    {useMoney(position.currentValue)}
                  </td>
                  <td className="px-3 text-right">
                    {position.pnl === null ? (
                      <span className="font-mono text-[var(--text-faint)]">—</span>
                    ) : (
                      <PnlText value={position.pnl} format="currency" />
                    )}
                  </td>
                  <td className="px-5 text-right">
                    {position.pnlPercent === null ? (
                      <span className="font-mono text-[var(--text-faint)]">—</span>
                    ) : (
                      <PnlText value={position.pnlPercent} format="percent" />
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
