import type {
  IWatchlistItem,
  IWatchlistItemWithPrice,
} from '../interfaces/watchlist.interface';
import type { IEdgarMetrics } from '../../edgar/interfaces/edgar.interface';

export type IWatchlistService = {
  addItem(userId: string, ticker: string): Promise<IWatchlistItem>;
  removeItem(userId: string, ticker: string): Promise<void>;
  getItems(userId: string): Promise<IWatchlistItemWithPrice[]>;
  compareMetrics(userId: string, tickers: string[]): Promise<IEdgarMetrics[]>;
};
