import type { WatchlistMetricsResult } from '../../types/watchlist.types';

export type WatchlistTab = 'ver' | 'comparar';

export const METRIC_ROWS: {
  label: string;
  key: keyof WatchlistMetricsResult['metrics'];
}[] = [
  { label: 'Revenue', key: 'revenue' },
  { label: 'Net Income', key: 'netIncome' },
  { label: 'EPS', key: 'eps' },
  { label: 'Total Assets', key: 'totalAssets' },
  { label: 'Total Liabilities', key: 'totalLiabilities' },
];

export function formatMetricValue(value: number, unit: string): string {
  if (unit === 'shares' || unit === 'pure') return value.toLocaleString();
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export function addWatchlistErrorLabel(error: Error | null): string | null {
  if (!error) return null;
  const msg = error.message ?? '';
  if (msg.includes('409') || msg.toLowerCase().includes('already'))
    return 'Este ticker ya está en tu watchlist.';
  if (msg.includes('404') || msg.toLowerCase().includes('not found'))
    return 'Ticker no encontrado en SEC EDGAR.';
  if (msg.includes('422') || msg.toLowerCase().includes('full'))
    return 'Tu watchlist está llena (máximo 20 empresas).';
  return 'No pudimos agregar el ticker. Intentá de nuevo.';
}

export function allMetricsEmpty(results: WatchlistMetricsResult[]): boolean {
  return results.every((r) =>
    METRIC_ROWS.every((row) => r.metrics[row.key].length === 0),
  );
}
