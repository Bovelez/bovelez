import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';

import type { IEdgarService } from '../../edgar/service/edgar.service.interface';
import { IWatchlistItemWithPrice } from '../interfaces/watchlist.interface';
import { IEdgarMetrics } from '../../edgar/interfaces/edgar.interface';
import type { IWatchlistService } from './watchlist.service.interface';
import { WATCHLIST_REPOSITORY } from '../repository/watchlist.repository.interface';
import type { IWatchlistRepository } from '../repository/watchlist.repository.interface';
import { PricesService } from '../../prices/service/prices.service';

export const MAX_WATCHLIST_SIZE = 20;

@Injectable()
export class WatchlistService implements IWatchlistService {
  constructor(
    @Inject(WATCHLIST_REPOSITORY)
    private readonly repository: IWatchlistRepository,
    @Inject('EdgarService')
    private readonly edgarService: IEdgarService,
    private readonly pricesService: PricesService,
  ) {}

  async addItem(userId: string, ticker: string) {
    const normalizedTicker = ticker.trim().toUpperCase();

    const count = await this.repository.countByUser(userId);
    if (count >= MAX_WATCHLIST_SIZE) {
      throw new UnprocessableEntityException(
        `Watchlist is full. You can track up to ${MAX_WATCHLIST_SIZE} companies.`,
      );
    }

    const existing = await this.repository.findOne(userId, normalizedTicker);
    if (existing) {
      throw new ConflictException(
        `${normalizedTicker} is already in your watchlist.`,
      );
    }

    const isValid = await this.edgarService.isValidTicker(normalizedTicker);
    if (!isValid) {
      throw new NotFoundException(
        `Ticker ${normalizedTicker} was not found in SEC EDGAR.`,
      );
    }

    return this.repository.add(userId, normalizedTicker);
  }

  async removeItem(userId: string, ticker: string) {
    const normalizedTicker = ticker.trim().toUpperCase();

    const item = await this.repository.findOne(userId, normalizedTicker);
    if (!item) {
      throw new NotFoundException(
        `${normalizedTicker} is not in your watchlist.`,
      );
    }

    await this.repository.remove(userId, normalizedTicker);
  }
  async getItems(userId: string): Promise<IWatchlistItemWithPrice[]> {
    const items = await this.repository.findByUser(userId);
    if (items.length === 0) return [];

    const tickers = items.map((item) => item.ticker);

    const [companies, priceMap] = await Promise.all([
      Promise.all(
        tickers.map((ticker) =>
          this.edgarService.getCompany(ticker).catch(() => null),
        ),
      ),
      this.pricesService.getPricesByTickersWithChange(tickers),
    ]);

    return items.map((item, i) => {
      const record = priceMap.get(item.ticker) ?? null;
      return {
        ...item,
        name: companies[i]?.name ?? null,
        price: record?.price ?? null,
        dailyChangePercent: record?.dailyChangePercent ?? null,
        priceUpdatedAt: record?.updatedAt?.toISOString() ?? null,
      };
    });
  }

  async compareMetrics(
    userId: string,
    tickers: string[],
  ): Promise<IEdgarMetrics[]> {
    await Promise.all(
      tickers.map(async (ticker) => {
        const normalizedTicker = ticker.trim().toUpperCase();
        const item = await this.repository.findOne(userId, normalizedTicker);
        if (!item) {
          throw new ForbiddenException(
            `${normalizedTicker} is not in your watchlist.`,
          );
        }
      }),
    );

    const results = await Promise.allSettled(
      tickers.map((ticker) =>
        this.edgarService.getMetrics(ticker.trim().toUpperCase(), {
          quarters: 4,
        }),
      ),
    );

    return results.map((result, i) => {
      if (result.status === 'fulfilled') return result.value;

      return {
        cik: '',
        name: tickers[i].toUpperCase(),
        metrics: {
          revenue: [],
          netIncome: [],
          eps: [],
          totalAssets: [],
          totalLiabilities: [],
        },
      } satisfies IEdgarMetrics;
    });
  }
}
