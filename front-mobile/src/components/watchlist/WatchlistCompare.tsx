import { AlertCircle, LoaderCircle } from "lucide-react";
import type { WatchlistItem, WatchlistMetricsResult } from "../../types/watchlist.types";
import {allMetricsEmpty, formatMetricValue, METRIC_ROWS} from "../../pages/watchlist/watchlist.utils.ts";

interface WatchlistCompareProps {
    items: WatchlistItem[];
    selected: string[];
    isPending: boolean;
    isError: boolean;
    results: WatchlistMetricsResult[];
    onToggle: (ticker: string) => void;
    onCompare: () => void;
}

export function WatchlistCompare({
    items,
    selected,
    isPending,
    isError,
    results,
    onToggle,
    onCompare,
                                 }: WatchlistCompareProps) {
    const hasResults = results.length > 0;

    return (
        <div data-testid="compare-section">

            {/* Ticker chips */}
            <div data-testid="compare-selector" className="flex flex-wrap gap-2 mb-5">
                {items.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)]">
                        Agregá empresas a tu watchlist para poder compararlas.
                    </p>
                )}
                {items.map((item) => {
                    const isSel = selected.includes(item.ticker);
                    return (
                        <button
                            key={item.ticker}
                            data-testid="compare-ticker-chip"
                            data-ticker={item.ticker}
                            onClick={() => onToggle(item.ticker)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                isSel ? "text-white" : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                            }`}
                            style={isSel ? { background: "var(--gradient-brand)" } : undefined}
                        >
                            {item.ticker}
                        </button>
                    );
                })}
            </div>

            {/* Compare button */}
            <button
                data-testid="compare-btn"
                onClick={onCompare}
                disabled={selected.length < 2 || isPending}
                className="mb-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                style={{ background: "var(--gradient-brand)" }}
            >
                {isPending && <LoaderCircle size={14} className="animate-spin" />}
                Comparar seleccionadas ({selected.length})
            </button>

            {/* Hint */}
            {!isPending && !hasResults && !isError && (
                <p data-testid="compare-hint" className="text-sm text-[var(--text-muted)]">
                    Seleccioná al menos 2 empresas y presioná Comparar.
                </p>
            )}

            {/* Error */}
            {isError && (
                <div
                    data-testid="compare-error"
                    className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/8 px-5 py-4 text-sm text-rose-300"
                >
                    <AlertCircle size={16} />
                    No pudimos obtener las métricas. Intentá de nuevo.
                </div>
            )}

            {/* Todas vacías — AC05 US-06-02 */}
            {!isPending && hasResults && allMetricsEmpty(results) && (
                <div
                    data-testid="compare-no-data"
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--text-muted)]"
                >
                    No hay métricas disponibles para ninguna de las empresas seleccionadas.
                </div>
            )}

            {/* Tabla de métricas — AC02 + AC03 US-06-02 */}
            {!isPending && hasResults && !allMetricsEmpty(results) && (
                <div
                    data-testid="compare-table"
                    className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
                >
                    {/* Header: empresas como columnas */}
                    <div
                        className="grid gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-widest bg-[var(--bg-deep)] text-[var(--text-faint)]"
                        style={{ gridTemplateColumns: `12rem repeat(${results.length}, 1fr)` }}
                    >
                        <span>Métrica</span>
                        {results.map((r) => (
                            <span key={r.name} data-testid="compare-col-header" className="font-mono text-[var(--primary)]">
                {r.name}
              </span>
                        ))}
                    </div>

                    {/* Filas: métricas */}
                    {METRIC_ROWS.map(({ label, key }, ri) => (
                        <div
                            key={label}
                            className="grid gap-4 px-5 py-3.5 items-center"
                            style={{
                                gridTemplateColumns: `12rem repeat(${results.length}, 1fr)`,
                                borderTop: ri > 0 ? "1px solid var(--border)" : "none",
                            }}
                        >
                            <span className="text-xs font-semibold text-[var(--text-muted)]">{label}</span>
                            {results.map((r) => {
                                const points = r.metrics[key];
                                const latest = points[points.length - 1];
                                if (!latest) {
                                    return (
                                        <span key={r.name} data-testid="metric-nd" className="text-xs font-bold text-[var(--text-faint)]">
                      N/D
                    </span>
                                    );
                                }
                                return (
                                    <span key={r.name} data-testid="metric-value" className="px-2 py-1 rounded text-xs font-bold font-mono text-[var(--text)]">
                    {formatMetricValue(latest.value, latest.unit)}
                  </span>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}