import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PricesService } from '../service/prices.service';
import { SPY_TICKERS } from '../seed/spy-tickers';

@Injectable()
export class PricesSchedulerService {
  private readonly logger = new Logger(PricesSchedulerService.name);

  constructor(private readonly pricesService: PricesService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async updatePrices(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;

    try {
      const result = await this.pricesService.runBatch([...SPY_TICKERS]);
      this.logger.log(
        `Scheduled price update finished: ${result.tickerCount} prices, ${result.errorCount} errors`,
      );
    } catch (error) {
      this.logger.error(
        'Scheduled price update failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
