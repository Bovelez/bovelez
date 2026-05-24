import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useStockPrices } from "../../hooks/prices/useStockPrices";
import type { StockPrice } from "../../types/prices.types";
import {useMoney} from "../../hooks/transactions/utils/useMoney.ts";

const DEFAULT_DURATION_SECONDS = 600;
const VISIBLE_TICKERS = 500;

type StockTickerBarProps = {
  durationSeconds?: number;
};

function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function getChangeStyle(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-[var(--text-faint)]";
  return value >= 0 ? "text-emerald-400" : "text-rose-400";
}

function StockTickerItem({ stock }: { stock: StockPrice }) {
  const changeClass = getChangeStyle(stock.dailyChangePercent);
  const hasChange =
    stock.dailyChangePercent !== null &&
    stock.dailyChangePercent !== undefined;
  const isPositive = hasChange && stock.dailyChangePercent!! >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <li className="flex h-12 shrink-0 items-center gap-3 border-r border-[var(--border)]/70 px-5">
      <span className="font-mono text-[12px] font-bold tracking-wide text-[var(--text)]">
        {stock.ticker}
      </span>
      <span className="font-mono text-[12px] text-[var(--text-muted)]">
        ${useMoney(stock.price)}
      </span>
      <span
        className={`inline-flex min-w-[76px] items-center gap-1 font-mono text-[12px] font-semibold ${changeClass}`}
      >
        {hasChange && (
          <TrendIcon size={13} strokeWidth={2.3} aria-hidden="true" />
        )}
        {formatChange(stock.dailyChangePercent)}
      </span>
    </li>
  );
}

function StockTickerTrack({
  prices,
  durationSeconds,
}: {
  prices: StockPrice[];
  durationSeconds: number;
}) {
  const items = [...prices, ...prices];

  return (
    <div className="relative flex-1 overflow-hidden" aria-hidden="true">
      <ul
        className="stock-ticker-track flex w-max whitespace-nowrap"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {items.map((stock, index) => (
          <StockTickerItem
            key={`${stock.ticker}-${stock.updatedAt}-${index}`}
            stock={stock}
          />
        ))}
      </ul>
    </div>
  );
}

function StockTickerSkeleton() {
  return (
    <div className="flex h-12 flex-1 items-center gap-5 overflow-hidden px-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <span
          key={index}
          className="h-4 w-28 shrink-0 animate-pulse rounded bg-[var(--surface-3)]"
        />
      ))}
    </div>
  );
}

export function StockTickerBar({
  durationSeconds = DEFAULT_DURATION_SECONDS,
}: StockTickerBarProps) {
  const { data, isError, isLoading } = useStockPrices();
  const prices = useMemo(
    () =>
      [...(data ?? [])]
        .filter((stock) => Number.isFinite(stock.price))
        .sort((a, b) => a.ticker.localeCompare(b.ticker))
        .slice(0, VISIBLE_TICKERS),
    [data],
  );

  return (
    <section
      data-testid="stock-ticker-bar"
      className="relative z-10 overflow-hidden rounded-2xl border border-[var(--border)]/60 bg-[var(--surface)]/70 shadow-2xl backdrop-blur-xl"
      aria-label="Cotizaciones del mercado"
    >
      <div className="pointer-events-none absolute inset-y-0 left-[86px] z-10 w-14 bg-gradient-to-r from-[var(--surface)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--surface)] to-transparent" />

      <div className="flex min-h-12 items-center">
        <div className="relative z-20 flex h-12 shrink-0 items-center gap-2 border-r border-[var(--border)]/70 bg-[var(--surface-2)]/90 px-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Market
          </span>
        </div>

        {isLoading && <StockTickerSkeleton />}

        {!isLoading && isError && (
          <p className="px-5 text-[12px] font-medium text-rose-300">
            No pudimos cargar cotizaciones.
          </p>
        )}

        {!isLoading && !isError && prices.length === 0 && (
          <p className="px-5 text-[12px] font-medium text-[var(--text-muted)]">
            Sin cotizaciones disponibles.
          </p>
        )}

        {!isLoading && !isError && prices.length > 0 && (
          <StockTickerTrack
            prices={prices}
            durationSeconds={durationSeconds}
          />
        )}
      </div>
    </section>
  );
}
