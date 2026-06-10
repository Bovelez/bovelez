import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, ShieldAlert, X } from "lucide-react";
import type { TickerSelectProps } from "../../types/prices.types";
import { getTickerSuggestions } from "../../hooks/prices/getTickerSuggestions.ts";
import { formatMoney } from "../../hooks/transactions/utils/formatMoney.ts";

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
      () => getTickerSuggestions(prices, query, 8, selectedPrice?.ticker),
      [prices, query, selectedPrice?.ticker],
  );

  useEffect(() => {
    if (selectedPrice) setQuery(selectedPrice.ticker);
  }, [selectedPrice]);

  const handleClear = () => {
    setQuery("");
    onClearSelection?.();
  };

  return (
      <section
          data-testid="edgar-ticker-select"
          data-cy="ticker-explorer"
          className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--surface)]/60 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] bg-[var(--surface-2)]/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Search size={20} strokeWidth={2} className="text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-black tracking-tight text-[var(--text)]">Explorador</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Mercado S&amp;P 500</p>
            </div>
          </div>
          {selectedPrice && (
              <div data-cy="ticker-selected-badge" className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/8 px-3 py-1.5">
                <span className="font-mono text-[13px] font-black text-orange-400">{selectedPrice.ticker}</span>
                <span className="font-mono text-[13px] font-bold text-[var(--text-muted)]">{formatMoney(selectedPrice.price)}</span>
              </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          {/* Search input */}
          <div className="relative">
            <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] transition-colors"
            />
            <input
                data-testid="edgar-ticker-search"
                data-cy="ticker-search"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="Buscar ticker · ej. AAPL, MSFT…"
                className="w-full rounded-xl border border-white/[0.08] bg-[var(--bg-deep)]/80 py-3.5 pl-11 pr-10 text-[14px] font-bold text-[var(--text)] shadow-inner outline-none transition-all focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 placeholder:font-normal placeholder:text-[var(--text-faint)]"
            />
            {selectedPrice && (
                <button
                    type="button"
                    data-testid="edgar-ticker-clear"
                    data-cy="ticker-clear"
                    onClick={handleClear}
                    aria-label="Limpiar selección"
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:bg-rose-500/15 hover:text-rose-400"
                >
                  <X size={13} />
                </button>
            )}
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-auto rounded-2xl border border-white/[0.05] bg-[var(--bg-deep)]/50 p-1.5 shadow-inner">

            {isLoading && (
                <div className="flex flex-col items-center gap-2 px-4 py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <p className="text-[12px] text-[var(--text-muted)]">Sincronizando mercado…</p>
                </div>
            )}

            {!isLoading && errorMessage && (
                <div className="px-4 py-8 text-center text-[13px] text-rose-400">{errorMessage}</div>
            )}

            {!isLoading && !errorMessage && suggestions.length === 0 && (
                <div data-cy="ticker-no-results" className="flex flex-col items-center gap-2 px-4 py-12">
                  <ShieldAlert size={22} className="text-[var(--text-faint)]" />
                  <span className="text-[12px] text-[var(--text-muted)]">Ticker no disponible para operar.</span>
                </div>
            )}

            {!isLoading && !errorMessage && suggestions.map((price) => {
              const isSelected = price.ticker === selectedPrice?.ticker;
              return (
                  <button
                      key={price.ticker}
                      type="button"
                      data-testid={`edgar-company-${price.ticker}`}
                      data-cy="ticker-row"
                      data-ticker={price.ticker}
                      onClick={() => onSelectPrice(price)}
                      className={`group mb-1 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150 last:mb-0 ${
                          isSelected
                              ? "border border-orange-500/20 bg-orange-500/8"
                              : "border border-transparent hover:bg-white/[0.04]"
                      }`}
                  >
                <span className="flex items-center gap-3">
                  <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] font-black transition-all ${
                          isSelected
                              ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/25"
                              : "bg-[var(--surface)] text-[var(--text)] group-hover:bg-[var(--surface-2)]"
                      }`}
                  >
                    {price.ticker.slice(0, 2)}
                  </span>
                  <span className="flex flex-col">
                    <span className={`font-mono text-[14px] font-black ${isSelected ? "text-orange-400" : "text-[var(--text)]"}`}>
                      {price.ticker}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(price.updatedAt).toLocaleTimeString()}
                    </span>
                  </span>
                </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                  <span className="font-mono text-[14px] font-bold text-[var(--text)]">
                    {formatMoney(price.price)}
                  </span>
                      {isSelected && (
                          <CheckCircle2 size={16} className="text-orange-400" />
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
