import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, ShieldCheck, X } from "lucide-react";
import type {TickerSelectProps} from "../../types/prices.types";
import {useGetTickerSuggestions} from "../../hooks/prices/useGetTickerSuggestions.ts";

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PriceTickerSelect({
  prices,
  selectedPrice,
  isLoading,
  errorMessage,
  onSelectPrice,
  onClearSelection,
}: TickerSelectProps) {
  const [query, setQuery] = useState("");
  const suggestions = useMemo(
    () => useGetTickerSuggestions(prices, query, 8, selectedPrice?.ticker),
    [prices, query, selectedPrice?.ticker],
  );

  useEffect(() => {
    if (selectedPrice) setQuery(selectedPrice.ticker);
  }, [selectedPrice]);

  const handleClearSelection = () => {
    setQuery("");
    onClearSelection?.();
  };

  return (
    <section
      data-testid="edgar-ticker-select"
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)]/60 bg-gradient-to-b from-[var(--surface)]/80 to-[var(--bg-deep)]/90 shadow-2xl backdrop-blur-2xl transition-all duration-500"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)]/40 bg-[var(--surface-2)]/20 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30">
            <Search size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">Descubrir</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Mercado S&amp;P 500
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="group relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
          <div className="relative flex items-center">
            <Search
              size={16}
              className="absolute left-4 text-[var(--text-faint)] transition-colors group-focus-within:text-[var(--primary)]"
            />
            <input
              data-testid="edgar-ticker-search"
              value={query}
              onChange={(event) => setQuery(event.target.value.toUpperCase())}
              placeholder="Buscar ticker (ej. AAPL)..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] py-3.5 pl-11 pr-10 text-[14px] font-medium text-[var(--text)] shadow-inner outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            />
            {selectedPrice && (
              <button
                type="button"
                data-testid="edgar-ticker-clear"
                onClick={handleClearSelection}
                className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:bg-rose-500/20 hover:text-rose-400"
                aria-label="Limpiar selección"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--bg-deep)]/50 p-2 shadow-inner">
          {isLoading && (
            <div className="animate-pulse px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">
              Sincronizando feed de mercado...
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="px-4 py-8 text-center text-[13px] text-rose-400">
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && suggestions.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <ShieldCheck size={24} className="text-[var(--text-faint)]" />
              <span className="text-[13px] text-[var(--text-muted)]">
                Ticker no disponible para operar.
              </span>
            </div>
          )}

          {!isLoading &&
            !errorMessage &&
            suggestions.map((price) => {
              const isSelected = price.ticker === selectedPrice?.ticker;

              return (
                <button
                  key={price.ticker}
                  type="button"
                  data-testid={`edgar-company-${price.ticker}`}
                  onClick={() => onSelectPrice(price)}
                  className={`group mb-1 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 last:mb-0 ${
                    isSelected
                      ? "border border-[var(--primary)]/20 bg-[var(--primary)]/10 shadow-sm"
                      : "border border-transparent hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[11px] font-bold transition-colors ${
                        isSelected
                          ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30"
                          : "bg-[var(--surface)] text-[var(--text)] group-hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      {price.ticker.slice(0, 2)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span
                        className={`block font-mono text-[14px] font-bold ${
                          isSelected
                            ? "text-[var(--primary)]"
                            : "text-[var(--text)]"
                        }`}
                      >
                        {price.ticker}
                      </span>
                      <span className="block truncate text-[10px] text-[var(--text-muted)]">
                        Ref: {new Date(price.updatedAt).toLocaleTimeString()}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-right">
                      <span className="block font-mono text-[14px] font-semibold text-[var(--text)]">
                        {formatMoney(price.price)}
                      </span>
                    </span>
                    {isSelected && (
                      <CheckCircle2
                        size={18}
                        className="animate-in fade-in zoom-in text-[var(--primary)]"
                      />
                    )}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </section>
  );
}
