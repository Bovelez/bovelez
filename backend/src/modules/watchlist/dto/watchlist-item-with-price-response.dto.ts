export class WatchlistItemWithPriceResponseDto {
  id: string;
  ticker: string;
  name: string | null;
  price: number | null;
  dailyChangePercent: number | null;
  priceUpdatedAt: Date | null;
  createdAt: Date;
  constructor(
    id: string,
    ticker: string,
    name: string | null,
    price: number | null,
    dailyChangePercent: number | null,
    priceUpdatedAt: Date | null,
    createdAt: Date,
  ) {
    this.id = id;
    this.ticker = ticker;
    this.name = name;
    this.price = price;
    this.dailyChangePercent = dailyChangePercent;
    this.priceUpdatedAt = priceUpdatedAt;
    this.createdAt = createdAt;
  }
}
