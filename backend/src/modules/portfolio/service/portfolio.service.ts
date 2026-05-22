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
    const pricesMap = await this.pricesService.getPricesByTickers(
      positions.map((p) => p.ticker),
    );

    const dtos = positions.map((pos) =>
      this.buildPositionDto(pos.ticker, pos.quantity, pos.avgCost, pricesMap),
    );

    return new PortfolioDto(dtos, lastRun?.finishedAt ?? null);
  }

  private buildPositionDto(
    ticker: string,
    quantity: number,
    avgCost: number,
    pricesMap: Map<string, number | null>,
  ): PortfolioPositionDto {
    const price = pricesMap.get(ticker.toUpperCase()) ?? null;
    return new PortfolioPositionDto({
      ticker,
      quantity,
      avgCost,
      currentPrice: price,
    });
  }
}
