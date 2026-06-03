import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IWatchlistRepository } from './watchlist.repository.interface';
import { IWatchlistItem } from '../interfaces/watchlist.interface';

@Injectable()
export class WatchlistRepository implements IWatchlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, ticker: string): Promise<IWatchlistItem> {
    return this.prisma.watchlistItem.create({
      data: { userId, ticker: ticker.toUpperCase() },
    });
  }

  async remove(userId: string, ticker: string): Promise<void> {
    await this.prisma.watchlistItem.delete({
      where: { userId_ticker: { userId, ticker: ticker.toUpperCase() } },
    });
  }

  async findByUser(userId: string): Promise<IWatchlistItem[]> {
    return this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(
    userId: string,
    ticker: string,
  ): Promise<IWatchlistItem | null> {
    return this.prisma.watchlistItem.findUnique({
      where: { userId_ticker: { userId, ticker: ticker.toUpperCase() } },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.watchlistItem.count({ where: { userId } });
  }
}
