export class WatchlistItemResponseDto {
  id: string;
  ticker: string;
  createdAt: Date;
  constructor(id: string, ticker: string, createdAt: Date) {
    this.id = id;
    this.ticker = ticker;
    this.createdAt = createdAt;
  }
}
