import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PricesRepository } from '../repository/prices.repository';
import { PRICES_REPOSITORY } from '../interfaces/prices.interface';
import { PricesService } from '../service/prices.service';
import { SPY_TICKERS } from './spy-tickers';

@Injectable()
export class PricesStartupSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(PricesStartupSeeder.name);

  constructor(
    @Inject(PRICES_REPOSITORY)
    private readonly repository: PricesRepository,
    private readonly pricesService: PricesService,
    private readonly configService: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.isStartupSeedEnabled()) return;
    void this.runSeed();
  }

  private static readonly SEED_CHUNK_SIZE = 50;

  async runSeed(): Promise<void> {
    try {
      const priceCount = await this.repository.countPrices();
      if (priceCount > 0) {
        const tickersMissingDailyChange =
          await this.repository.findTickersMissingDailyChangePercent();
        if (tickersMissingDailyChange.length > 0) {
          this.logger.log(
            `Refreshing ${tickersMissingDailyChange.length} prices missing daily change percent`,
          );
          await this.runSeedBatches(tickersMissingDailyChange);
          return;
        }

        this.logger.log(
          `Skipping startup price seed because StockPrice has ${priceCount} records`,
        );
        return;
      }

      const tickers = this.getSeedTickers();
      this.logger.log(
        `StockPrice is empty; seeding ${tickers.length} S&P 500 tickers in chunks of ${PricesStartupSeeder.SEED_CHUNK_SIZE}`,
      );

      const { totalPrices, totalErrors } = await this.runSeedBatches(tickers);

      this.logger.log(
        `Startup price seed finished: ${totalPrices} prices, ${totalErrors} errors`,
      );
    } catch (error) {
      this.logger.error(
        'Startup price seed failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private isStartupSeedEnabled(): boolean {
    if (process.env.NODE_ENV === 'test') return false;

    const value = this.configService.get<string>(
      'SEED_SPY_PRICES_ON_STARTUP',
      'true',
    );

    return !['0', 'false', 'no', 'off'].includes(value.toLowerCase());
  }

  private async runSeedBatches(
    tickers: string[],
  ): Promise<{ totalPrices: number; totalErrors: number }> {
    let totalPrices = 0;
    let totalErrors = 0;

    for (
      let i = 0;
      i < tickers.length;
      i += PricesStartupSeeder.SEED_CHUNK_SIZE
    ) {
      const chunk = tickers.slice(i, i + PricesStartupSeeder.SEED_CHUNK_SIZE);
      const result = await this.pricesService.runBatch(chunk);
      totalPrices += result.tickerCount;
      totalErrors += result.errorCount;
      this.logger.log(
        `Seed progress: ${Math.min(i + PricesStartupSeeder.SEED_CHUNK_SIZE, tickers.length)}/${tickers.length} tickers processed`,
      );
    }

    return { totalPrices, totalErrors };
  }

  private getSeedTickers(): string[] {
    const configuredTickers = this.configService.get<string>('SPY_TICKERS');
    if (configuredTickers) return this.normalizeTickers(configuredTickers);

    return [...SPY_TICKERS];
  }

  private normalizeTickers(value: string): string[] {
    return Array.from(
      new Set(
        value
          .split(',')
          .map((ticker) => ticker.trim().toUpperCase().replace(/\./g, '-'))
          .filter((ticker) => /^[A-Z0-9-]+$/.test(ticker)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }
}
