import { IWatchlistItem } from '../interfaces/watchlist.interface';

export interface IWatchlistRepository {
  add(userId: string, ticker: string): Promise<IWatchlistItem>;
  remove(userId: string, ticker: string): Promise<void>;
  findByUser(userId: string): Promise<IWatchlistItem[]>;
  findOne(userId: string, ticker: string): Promise<IWatchlistItem | null>;
  countByUser(userId: string): Promise<number>;
}

export const WATCHLIST_REPOSITORY = 'WATCHLIST_REPOSITORY';
