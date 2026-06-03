export interface IWatchlistItem {
  id: string;
  userId: string;
  ticker: string;
  createdAt: Date;
}

export interface IWatchlistItemWithPrice extends IWatchlistItem {
  name: string | null;
  price: number | null;
  dailyChangePercent: number | null;
  priceUpdatedAt: string | null;
}
