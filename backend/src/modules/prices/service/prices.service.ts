import { Inject, Injectable } from '@nestjs/common';
import { PricesRepository } from '../repository/prices.repository';
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
    const { prices, errors } = await this.yahooClient.fetchPrices(tickers);

    for (const [ticker, price] of Object.entries(prices)) {
      await this.repository.upsertPrice(ticker, price);
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
      errors,
    };
  }

  async getPrice(ticker: string) {
    return this.repository.findPrice(ticker.toUpperCase());
  }

  async getAllPrices() {
    return this.repository.findAllPrices();
  }

  async getLastBatchRun() {
    return this.repository.findLastBatchRun();
  }
}
