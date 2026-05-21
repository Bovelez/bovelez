import { Injectable } from '@nestjs/common';
import { Position } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {IPortfolioRepository,} from './portfolio.repository.interface';
import { UpdatePositionInput } from '../input/update-position.input';
import { CreatePositionInput } from '../input/create-position.input';

@Injectable()
export class PortfolioRepository implements IPortfolioRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(userId: string, data: CreatePositionInput): Promise<Position> {
    return this.prismaService.position.create({ data: { userId, ...data } });
  }

  findById(id: string): Promise<Position | null> {
    return this.prismaService.position.findUnique({ where: { id } });
  }

  findAllByUser(userId: string): Promise<Position[]> {
    return this.prismaService.position.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  update(id: string, data: UpdatePositionInput): Promise<Position> {
    return this.prismaService.position.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.position.delete({ where: { id } });
  }
}
