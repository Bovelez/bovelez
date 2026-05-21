import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { IPricesRepository, StockPriceRecord, PriceBatchRunRecord } from './prices.repository.interface';

@Injectable()
export class PricesRepository implements IPricesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma as any;
  }

  async upsertPrice(ticker: string, price: number): Promise<StockPriceRecord> {
    return this.db.stockPrice.upsert({
      where: { ticker },
      update: { price },
      create: { ticker, price },
    });
  }

  async findPrice(ticker: string): Promise<StockPriceRecord | null> {
    return this.db.stockPrice.findUnique({ where: { ticker } });
  }

  async findAllPrices(): Promise<StockPriceRecord[]> {
    return this.db.stockPrice.findMany({ orderBy: { ticker: 'asc' } });
  }

  async createBatchRun(): Promise<PriceBatchRunRecord> {
    return this.db.priceBatchRun.create({ data: {} });
  }

  async finishBatchRun(
    id: string,
    tickerCount: number,
    errorCount: number,
    errors: Record<string, string>,
  ): Promise<PriceBatchRunRecord> {
    return this.db.priceBatchRun.update({
      where: { id },
      data: {
        finishedAt: new Date(),
        tickerCount,
        errorCount,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      },
    });
  }

  async findLastBatchRun(): Promise<PriceBatchRunRecord | null> {
    return this.db.priceBatchRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });
  }
}
