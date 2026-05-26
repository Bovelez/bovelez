import { useRef, useState } from "react";
import {
    AlertCircle, CheckCircle2, LoaderCircle, Plus, Search, X,
} from "lucide-react";
import { useWatchlistSearch } from "../../hooks/watchlist/useWatchlistSearch";
import type { StockPrice } from "../../types/prices.types";

interface WatchlistAddFormProps {
    prices: StockPrice[];
    isPending: boolean;
    error: string | null;
    success: boolean;
    onAdd: (ticker: string) => void;
    onReset: () => void;
}

export function WatchlistAddForm({
    prices,
    isPending,
    error,
    success,
    onAdd,
    onReset,
    }: WatchlistAddFormProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestions = useWatchlistSearch(prices, query);

    const handleChange = (value: string) => {
        setQuery(value.toUpperCase());
        setOpen(true);
        onReset();
    };

    const handleSelect = (ticker: string) => {
        setQuery(ticker);
        setOpen(false);
        onAdd(ticker);
    };

    const handleClear = () => {
        setQuery("");
        setOpen(false);
        onReset();
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && query.trim()) {
            setOpen(false);
            onAdd(query.trim());
        }
        if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const showDropdown = open && query.length >= 1 && suggestions.length > 0;

    return (
        <div data-cy="add-ticker-form" className="relative z-20 mb-6">
            <div className="flex gap-3">
                <div className="relative flex-1 min-w-0">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
                    />
                    <input
                        ref={inputRef}
                        data-cy="ticker-input"
                        type="text"
                        placeholder="Buscá por ticker · ej: AAPL…"
                        value={query}
                        maxLength={10}
                        autoComplete="off"
                        onChange={(e) => handleChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.length >= 1 && setOpen(true)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-8 pr-9 py-2.5 text-sm font-mono font-bold text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text)] transition-colors"
                            aria-label="Limpiar búsqueda"
                        >
                            <X size={13} />
                        </button>
                    )}

                    {showDropdown && (
                        <div
                            data-cy="ticker-suggestions"
                            className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden z-50"
                        >
                            {suggestions.map((s) => (
                                <button
                                    key={s.ticker}
                                    type="button"
                                    data-cy="ticker-suggestion-item"
                                    data-ticker={s.ticker}
                                    onClick={() => handleSelect(s.ticker)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors border-t border-[var(--border)] first:border-t-0"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-deep)] font-mono text-[11px] font-black text-[var(--primary)]">
                                        {s.ticker.slice(0, 2)}
                                    </div>
                                    <span className="font-mono text-[13px] font-black text-[var(--text)]">
                                        {s.ticker}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    data-cy="add-ticker-btn"
                    onClick={() => { if (query.trim()) onAdd(query.trim()); }}
                    disabled={isPending || !query.trim()}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                    style={{ background: "var(--gradient-brand)", boxShadow: "0 4px 14px rgba(255,107,53,0.25)" }}
                >
                    {isPending
                        ? <LoaderCircle size={14} className="animate-spin" />
                        : <Plus size={14} />}
                    Agregar
                </button>
            </div>

            {error && (
                <div data-cy="add-error" className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/8 px-4 py-2.5 text-sm text-rose-300">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                </div>
            )}
            {success && !error && (
                <div data-cy="add-success" className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-2.5 text-sm text-emerald-300">
                    <CheckCircle2 size={14} className="shrink-0" />
                    Empresa agregada correctamente.
                </div>
            )}
        </div>
    );
}