import apiClient from './apiClient';
import type {
  SearchResponseDto,
  WatchlistItem,
  WatchlistMetricsResult,
} from '../types/watchlist.types';

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await apiClient.get<WatchlistItem[]>('/watchlist');
  return data;
}

export async function addWatchlistItem(ticker: string): Promise<WatchlistItem> {
  const { data } = await apiClient.post<WatchlistItem>('/watchlist', {
    ticker,
  });
  return data;
}

export async function removeWatchlistItem(ticker: string): Promise<void> {
  await apiClient.delete(`/watchlist/${encodeURIComponent(ticker)}`);
}

export async function compareWatchlistMetrics(
  tickers: string[],
): Promise<WatchlistMetricsResult[]> {
  const { data } = await apiClient.post<WatchlistMetricsResult[]>(
    '/watchlist/compare',
    { tickers },
  );
  return data;
}
export async function searchEdgar(query: string): Promise<SearchResponseDto[]> {
  const { data } = await apiClient.get<SearchResponseDto[]>('/edgar/search', {
    params: { q: query },
  });
  return data;
}
