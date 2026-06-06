export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string | null;
  price: number | null;
  dailyChangePercent: number | null;
  priceUpdatedAt: string | null;
  createdAt: string;
}

export interface WatchlistMetricsResult {
  cik: string;
  name: string;
  metrics: {
    revenue: MetricPoint[];
    netIncome: MetricPoint[];
    eps: MetricPoint[];
    totalAssets: MetricPoint[];
    totalLiabilities: MetricPoint[];
  };
}

export interface MetricPoint {
  quarter: string;
  value: number;
  unit: string;
  filedAt: string;
}

export interface SearchResponseDto {
  cik: string;
  ticker: string;
  name: string;
  filingType: string;
  filedAt: string;
  description: string;
}
