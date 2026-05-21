import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Position } from '@prisma/client';
import type { IEdgarService } from '../../edgar/service/edgar.service.interface';
import type { IPortfolioRepository } from '../repository/portfolio.repository.interface';
import { PositionDto } from '../dto/position.dto';
import { PortfolioDto, PortfolioPositionDto } from '../dto/portfolio.dto';
import type { CreatePositionInput } from '../input/create-position.input';
import type { UpdatePositionInput } from '../input/update-position.input';

const MOCK_PRICE = 1;

@Injectable()
export class PortfolioService {
  constructor(
    @Inject('PortfolioRepository')
    private readonly portfolioRepository: IPortfolioRepository,
    @Inject('EdgarService')
    private readonly edgarService: IEdgarService,
  ) {}

  async addPosition(
    userId: string,
    input: CreatePositionInput,
  ): Promise<PositionDto> {
    const valid = await this.edgarService.isValidTicker(input.ticker);
    if (!valid) {
      throw new BadRequestException('Ticker no válido');
    }

    const position = await this.portfolioRepository.create(userId, input);
    return new PositionDto(position);
  }

  async getPortfolio(userId: string): Promise<PortfolioDto> {
    const positions = await this.portfolioRepository.findAllByUser(userId);

    const dtos = positions.map(
      (position) =>
        new PortfolioPositionDto({
          id: position.id,
          ticker: position.ticker,
          quantity: position.quantity,
          buyPrice: position.buyPrice,
          buyDate: position.buyDate,
          currentPrice: MOCK_PRICE,
        }),
    );

    return new PortfolioDto(dtos, null);
  }

  async getPosition(userId: string, id: string): Promise<PositionDto> {
    const position = await this.requireOwnedPosition(userId, id);
    return new PositionDto(position);
  }

  async updatePosition(
    userId: string,
    id: string,
    input: UpdatePositionInput,
  ): Promise<PositionDto> {
    await this.requireOwnedPosition(userId, id);

    const updated = await this.portfolioRepository.update(id, input);
    return new PositionDto(updated);
  }

  async deletePosition(
    userId: string,
    id: string,
    quantity: number | undefined,
  ): Promise<void> {
    const position = await this.requireOwnedPosition(userId, id);

    if (quantity === undefined || quantity >= position.quantity) {
      if (quantity !== undefined && quantity > position.quantity) {
        throw new BadRequestException(
          'No se pueden eliminar más acciones de las disponibles',
        );
      }
      await this.portfolioRepository.delete(id);
      return;
    }

    await this.portfolioRepository.update(id, {
      quantity: position.quantity - quantity,
    });
  }

  private async requireOwnedPosition(
    userId: string,
    id: string,
  ): Promise<Position> {
    const position = await this.portfolioRepository.findById(id);
    if (!position) {
      throw new NotFoundException('Posición no encontrada');
    }
    if (position.userId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta posición');
    }
    return position;
  }
}
