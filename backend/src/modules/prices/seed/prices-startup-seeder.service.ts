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
          const result = await this.pricesService.runBatch(
            tickersMissingDailyChange,
          );
          this.logger.log(
            `Refresh finished: ${result.tickerCount} prices, ${result.errorCount} errors`,
          );
          return;
        }

        this.logger.log(
          `Skipping startup price seed because StockPrice has ${priceCount} records`,
        );
        return;
      }

      const tickers = this.getSeedTickers();
      this.logger.log(
        `StockPrice is empty; seeding ${tickers.length} S&P 500 tickers`,
      );

      const result = await this.pricesService.runBatch(tickers);

      this.logger.log(
        `Startup price seed finished: ${result.tickerCount} prices, ${result.errorCount} errors`,
      );
    } catch (error) {
      this.logger.error(
        'Startup price seed failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private isStartupSeedEnabled(): boolean {
    const value = this.configService.get<string>(
      'SEED_SPY_PRICES_ON_STARTUP',
      'true',
    );

    return !['0', 'false', 'no', 'off'].includes(value.toLowerCase());
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
