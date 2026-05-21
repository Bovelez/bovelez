import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import type { IEdgarService } from '../../edgar/service/edgar.service.interface';
import { PricesService } from '../../prices/service/prices.service';
import type { IPortfolioRepository } from '../repository/portfolio.repository.interface';
import { TransactionDto } from '../dto/transaction.dto';
import { PortfolioDto, PortfolioPositionDto } from '../dto/portfolio.dto';
import type { BuyPositionInput } from '../input/buy-position.input';
import type { SellPositionInput } from '../input/sell-position.input';

@Injectable()
export class PortfolioService {
  constructor(
    @Inject('PortfolioRepository')
    private readonly portfolioRepository: IPortfolioRepository,
    @Inject('EdgarService')
    private readonly edgarService: IEdgarService,
    private readonly pricesService: PricesService,
  ) {}

  async buy(userId: string, input: BuyPositionInput): Promise<TransactionDto> {
    const valid = await this.edgarService.isValidTicker(input.ticker);
    if (!valid) {
      throw new BadRequestException('Ticker no válido');
    }

    const priceRecord = await this.pricesService.getPrice(input.ticker);
    if (!priceRecord) {
      throw new BadRequestException(
        `No hay precio registrado para ${input.ticker}. Ejecutá el batch de precios primero.`,
      );
    }

    const tx = await this.portfolioRepository.createTransaction(
      userId,
      input.ticker,
      TransactionType.BUY,
      input.quantity,
      priceRecord.price,
      input.date,
    );

    return new TransactionDto(tx);
  }

  async sell(userId: string, input: SellPositionInput): Promise<TransactionDto> {
    const position = await this.portfolioRepository.getAggregatedPosition(
      userId,
      input.ticker,
    );

    if (!position || position.quantity === 0) {
      throw new BadRequestException(
        `No tenés posición abierta en ${input.ticker}`,
      );
    }

    if (input.quantity > position.quantity) {
      throw new BadRequestException(
        `Querés vender ${input.quantity} acciones pero solo tenés ${position.quantity}`,
      );
    }

    // Sell at current market price stored in DB
    const priceRecord = await this.pricesService.getPrice(input.ticker);
    if (!priceRecord) {
      throw new BadRequestException(
        `No hay precio registrado para ${input.ticker}. Ejecutá el batch de precios primero.`,
      );
    }

    const tx = await this.portfolioRepository.createTransaction(
      userId,
      input.ticker,
      TransactionType.SELL,
      input.quantity,
      priceRecord.price,
      input.date,
    );

    return new TransactionDto(tx);
  }

  async getPortfolio(userId: string): Promise<PortfolioDto> {
    const positions = await this.portfolioRepository.getAggregatedPositions(userId);

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
