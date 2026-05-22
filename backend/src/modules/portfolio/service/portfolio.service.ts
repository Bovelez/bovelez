import { Injectable } from '@nestjs/common';
import { PricesService } from '../../prices/service/prices.service';
import { TransactionsService } from '../../transactions/service/transactions.service';
import { PortfolioDto, PortfolioPositionDto } from '../dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly pricesService: PricesService,
  ) {}

  async getPortfolio(userId: string): Promise<PortfolioDto> {
    const positions = await this.transactionsService.getOpenPositions(userId);
    const lastRun = await this.pricesService.getLastBatchRun();

    const dtos = await Promise.all(
      positions.map(async (pos) => {
        const priceRecord = await this.pricesService.getPrice(pos.ticker);
        return new PortfolioPositionDto({
          ticker: pos.ticker,
          quantity: pos.quantity,
          avgCost: pos.avgCost,
          currentPrice: priceRecord ? priceRecord.price : null,
        });
      }),
    );

    return new PortfolioDto(dtos, lastRun?.finishedAt ?? null);
  }
}
