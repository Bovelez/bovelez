import { Inject, Injectable } from '@nestjs/common';
import { PricesRepository } from '../repository/prices.repository';
import type { StockPriceRecord } from '../repository/prices.repository.interface';
import {
  YAHOO_FINANCE_CLIENT,
  PRICES_REPOSITORY,
  type IYahooFinanceClient,
} from '../interfaces/prices.interface';

@Injectable()
export class PricesService {
  constructor(
    @Inject(PRICES_REPOSITORY)
    private readonly repository: PricesRepository,
    @Inject(YAHOO_FINANCE_CLIENT)
    private readonly yahooClient: IYahooFinanceClient,
  ) {}

  async runBatch(tickers: string[]) {
    const run = await this.repository.createBatchRun();
    const {
      prices,
      dailyChangePercentages = {},
      errors,
    } = await this.yahooClient.fetchPrices(tickers);

    for (const [ticker, price] of Object.entries(prices)) {
      await this.repository.upsertPrice(
        ticker,
        price,
        dailyChangePercentages[ticker] ?? null,
      );
    }

    const finished = await this.repository.finishBatchRun(
      run.id,
      Object.keys(prices).length,
      Object.keys(errors).length,
      errors,
    );

    return {
      batchId: finished.id,
      startedAt: finished.startedAt,
      finishedAt: finished.finishedAt,
      tickerCount: finished.tickerCount,
      errorCount: finished.errorCount,
      prices,
      dailyChangePercentages,
      errors,
    };
  }

  async getPrice(ticker: string) {
    return this.repository.findPrice(ticker.toUpperCase());
  }

  async getPricesByTickers(
    tickers: string[],
  ): Promise<Map<string, number | null>> {
    const uniqueTickers = this.normalizeTickers(tickers);

    return this.hasNoTickers(uniqueTickers)
      ? new Map()
      : this.fetchAndAlignPrices(uniqueTickers);
  }

  async getAllPrices() {
    return this.repository.findAllPrices();
  }

  async getLastBatchRun() {
    return this.repository.findLastBatchRun();
  }

  private async fetchAndAlignPrices(
    uniqueTickers: string[],
  ): Promise<Map<string, number | null>> {
    const records = await this.repository.findPricesByTickers(uniqueTickers);
    const foundPrices = this.mapRecordsToPrices(records);
    return this.alignPricesWithTickers(uniqueTickers, foundPrices);
  }

  private hasNoTickers(tickers: string[]): boolean {
    return tickers.length === 0;
  }

  private mapRecordsToPrices(records: StockPriceRecord[]): Map<string, number> {
    return new Map(records.map((record) => [record.ticker, record.price]));
  }

  private alignPricesWithTickers(
    uniqueTickers: string[],
    foundPrices: Map<string, number>,
  ): Map<string, number | null> {
    return new Map(
      uniqueTickers.map((ticker) => [ticker, foundPrices.get(ticker) ?? null]),
    );
  }

  private normalizeTickers(tickers: string[]): string[] {
    return Array.from(
      new Set(
        tickers
          .map((ticker) => ticker.trim().toUpperCase())
          .filter((ticker) => ticker.length > 0),
      ),
    );
  }
  async getPricesByTickersWithChange(
    tickers: string[],
  ): Promise<Map<string, StockPriceRecord | null>> {
    const uniqueTickers = this.normalizeTickers(tickers);
    if (this.hasNoTickers(uniqueTickers)) return new Map();

    const records = await this.repository.findPricesByTickers(uniqueTickers);
    const found = new Map(records.map((r) => [r.ticker, r]));

    return new Map(
      uniqueTickers.map((ticker) => [ticker, found.get(ticker) ?? null]),
    );
  }
}
