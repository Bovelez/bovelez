import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useStockPrices } from "../../hooks/prices/useStockPrices";
import type { StockPrice } from "../../types/prices.types";
import { useMoney } from "../../hooks/transactions/utils/useMoney.ts";

const DEFAULT_DURATION_SECONDS = 600;
const VISIBLE_TICKERS = 500;

type StockTickerBarProps = { durationSeconds?: number };

function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function StockTickerItem({ stock }: { stock: StockPrice }) {
  const hasChange = stock.dailyChangePercent !== null && stock.dailyChangePercent !== undefined;
  const isPositive = hasChange && stock.dailyChangePercent! >= 0;
  const changeColor = !hasChange
      ? "text-[var(--text-faint)]"
      : isPositive
          ? "text-emerald-400"
          : "text-rose-400";

  return (
      <li className="flex h-11 shrink-0 items-center gap-3 border-r border-white/[0.06] px-5">
      <span className="font-mono text-[12px] font-black tracking-wide text-[var(--text)]">
        {stock.ticker}
      </span>
        <span className="font-mono text-[12px] text-[var(--text-muted)]">
        {useMoney(stock.price)}
      </span>
        <span className={`inline-flex min-w-[72px] items-center gap-1 font-mono text-[11px] font-bold ${changeColor}`}>
        {hasChange && (
            isPositive
                ? <TrendingUp size={11} strokeWidth={2.5} aria-hidden="true" />
                : <TrendingDown size={11} strokeWidth={2.5} aria-hidden="true" />
        )}
          {formatChange(stock.dailyChangePercent)}
      </span>
      </li>
  );
}

function StockTickerTrack({ prices, durationSeconds }: { prices: StockPrice[]; durationSeconds: number }) {
  const items = [...prices, ...prices];
  return (
      <div className="relative flex-1 overflow-hidden" aria-hidden="true">
        <ul
            className="stock-ticker-track flex w-max whitespace-nowrap"
            style={{ animationDuration: `${durationSeconds}s` }}
        >
          {items.map((stock, i) => (
              <StockTickerItem key={`${stock.ticker}-${stock.updatedAt}-${i}`} stock={stock} />
          ))}
        </ul>
      </div>
  );
}

function StockTickerSkeleton() {
  return (
      <div className="flex h-11 flex-1 items-center gap-5 overflow-hidden px-5">
        {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="h-3.5 w-24 shrink-0 animate-pulse rounded-md bg-white/[0.06]" />
        ))}
      </div>
  );
}

export function StockTickerBar({ durationSeconds = DEFAULT_DURATION_SECONDS }: StockTickerBarProps) {
  const { data, isError, isLoading } = useStockPrices();
  const prices = useMemo(
      () =>
          [...(data ?? [])]
              .filter((s) => Number.isFinite(s.price))
              .sort((a, b) => a.ticker.localeCompare(b.ticker))
              .slice(0, VISIBLE_TICKERS),
      [data],
  );

  return (
      <section
          data-testid="stock-ticker-bar"
          className="relative z-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--surface)]/60 shadow-xl backdrop-blur-xl"
          aria-label="Cotizaciones del mercado"
      >
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-[88px] z-10 w-12 bg-gradient-to-r from-[var(--surface)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--surface)] to-transparent" />

        <div className="flex min-h-11 items-center">
          {/* Label */}
          <div className="relative z-20 flex h-11 shrink-0 items-center gap-2 border-r border-white/[0.06] bg-[var(--surface-2)]/60 px-4">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Market
          </span>
          </div>

          {isLoading && <StockTickerSkeleton />}

          {!isLoading && isError && (
              <p className="px-5 text-[12px] font-semibold text-rose-400">
                Error al cargar cotizaciones.
              </p>
          )}

          {!isLoading && !isError && prices.length === 0 && (
              <p className="px-5 text-[12px] font-semibold text-[var(--text-muted)]">
                Sin cotizaciones disponibles.
              </p>
          )}

          {!isLoading && !isError && prices.length > 0 && (
              <StockTickerTrack prices={prices} durationSeconds={durationSeconds} />
          )}
        </div>
      </section>
  );
}
