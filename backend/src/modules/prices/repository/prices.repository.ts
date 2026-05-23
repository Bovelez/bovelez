import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  IPricesRepository,
  StockPriceRecord,
  PriceBatchRunRecord,
} from './prices.repository.interface';

@Injectable()
export class PricesRepository implements IPricesRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertPrice(ticker: string, price: number): Promise<StockPriceRecord> {
    return this.prisma.stockPrice.upsert({
      where: { ticker },
      update: { price },
      create: { ticker, price },
    });
  }

  findPrice(ticker: string): Promise<StockPriceRecord | null> {
    return this.prisma.stockPrice.findUnique({ where: { ticker } });
  }

  findPricesByTickers(tickers: string[]): Promise<StockPriceRecord[]> {
    return this.prisma.stockPrice.findMany({
      where: { ticker: { in: tickers } },
      orderBy: { ticker: 'asc' },
    });
  }

  findAllPrices(): Promise<StockPriceRecord[]> {
    return this.prisma.stockPrice.findMany({ orderBy: { ticker: 'asc' } });
  }

  countPrices(): Promise<number> {
    return this.prisma.stockPrice.count();
  }

  createBatchRun(): Promise<PriceBatchRunRecord> {
    return this.prisma.priceBatchRun.create({ data: {} });
  }

  finishBatchRun(
    id: string,
    tickerCount: number,
    errorCount: number,
    errors: Record<string, string>,
  ): Promise<PriceBatchRunRecord> {
    return this.prisma.priceBatchRun.update({
      where: { id },
      data: {
        finishedAt: new Date(),
        tickerCount,
        errorCount,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      },
    });
  }

  findLastBatchRun(): Promise<PriceBatchRunRecord | null> {
    return this.prisma.priceBatchRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });
  }
}
