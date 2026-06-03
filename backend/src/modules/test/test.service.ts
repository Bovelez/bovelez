import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class TestingService {
  constructor(private readonly prisma: PrismaService) {}

  async resetAndSeed() {
    await this.truncateAll();
    await this.seed();
  }

  private async truncateAll() {
    await this.prisma.$transaction([
      this.prisma.transaction.deleteMany(),
      this.prisma.watchlistItem.deleteMany(),
      this.prisma.user.deleteMany(),
      this.prisma.price.deleteMany(),
      this.prisma.stockPrice.deleteMany(),
      this.prisma.priceUpdateLog.deleteMany(),
      this.prisma.priceBatchRun.deleteMany(),
      this.prisma.edgarCompany.deleteMany(),
    ]);
  }
  private async seed() {
    const passwordHash = await argon2.hash('password123', {
      type: argon2.argon2id,
    });
    const user = await this.prisma.user.create({
      data: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Juan Martínez',
        email: 'juan@email.com',
        password: passwordHash,
      },
    });

    await this.prisma.watchlistItem.createMany({
      data: [
        { id: '1', userId: user.id, ticker: 'AAPL' },
        { id: '2', userId: user.id, ticker: 'MSFT' },
        { id: '3', userId: user.id, ticker: 'GOOGL' },
      ],
    });

    await this.prisma.stockPrice.createMany({
      data: [
        {
          ticker: 'AAPL',
          price: 189.5,
          dailyChangePercent: 1.23,
          updatedAt: new Date('2025-01-15T10:30:00.000Z'),
        },
        {
          ticker: 'MSFT',
          price: 415.2,
          dailyChangePercent: -0.45,
          updatedAt: new Date('2025-01-15T10:30:00.000Z'),
        },
        {
          ticker: 'TSLA',
          price: 250.0,
          dailyChangePercent: null,
          updatedAt: new Date('2025-01-15T10:30:00.000Z'),
        },
      ],
    });

    await this.prisma.edgarCompany.createMany({
      data: [
        { cik: '0000320193', ticker: 'AAPL', name: 'Apple Inc.' },
        { cik: '0000789019', ticker: 'MSFT', name: 'Microsoft Corp.' },
        { cik: '0001652044', ticker: 'GOOGL', name: 'Alphabet Inc.' },
        { cik: '0001318605', ticker: 'TSLA', name: 'Tesla Inc.' },
      ],
    });
  }
}
