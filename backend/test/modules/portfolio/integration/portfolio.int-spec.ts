import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient, TransactionType } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { YAHOO_FINANCE_CLIENT } from '../../../../src/modules/prices/interfaces/prices.interface';
import { register } from '../../../utils/register';
import { login } from '../../../utils/login';
import { getHttpServer } from '../../../utils/http-server';

const AAPL_PRICE = 200;
const MSFT_PRICE = 420;

const mockYahooClient = {
  fetchPrices: jest.fn(),
};

const mockEdgarService = {
  isValidTicker: jest.fn().mockResolvedValue(true),
  syncCompany: jest.fn(),
  getCompany: jest.fn(),
  getAllCompanies: jest.fn(),
  searchCompanies: jest.fn(),
  getFilings: jest.fn(),
  getMetrics: jest.fn(),
};

describe('Portfolio Integration', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(YAHOO_FINANCE_CLIENT)
      .useValue(mockYahooClient)
      .overrideProvider('EdgarService')
      .useValue(mockEdgarService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = new PrismaClient();
  });

  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.stockPrice.deleteMany();
    await prisma.priceBatchRun.deleteMany();
    await prisma.user.deleteMany();

    await register(app, {
      name: 'Juan',
      email: 'juan@email.com',
      password: 'Password1!',
    });
    const loginResponse = await login(app, 'juan@email.com', 'Password1!');
    token = loginResponse.token;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'juan@email.com' },
    });
    userId = user.id;

    await seedPrice('AAPL', AAPL_PRICE);
    await seedPrice('MSFT', MSFT_PRICE);
    await seedPriceBatchRun();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.transaction.deleteMany();
      await prisma.stockPrice.deleteMany();
      await prisma.priceBatchRun.deleteMany();
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  async function seedPrice(ticker: string, price: number): Promise<void> {
    await prisma.stockPrice.upsert({
      where: { ticker },
      update: { price },
      create: { ticker, price },
    });
  }

  async function seedPriceBatchRun(): Promise<void> {
    await prisma.priceBatchRun.create({
      data: {
        finishedAt: new Date('2025-01-20T00:00:00.000Z'),
        tickerCount: 2,
        errorCount: 0,
      },
    });
  }

  async function seedTransaction(input: {
    userId?: string;
    ticker: string;
    type?: TransactionType;
    quantity: number;
    price: number;
    date: string;
  }): Promise<void> {
    await prisma.transaction.create({
      data: {
        userId: input.userId ?? userId,
        ticker: input.ticker,
        type: input.type ?? TransactionType.BUY,
        quantity: input.quantity,
        price: input.price,
        date: new Date(input.date),
      },
    });
  }

  describe('GET /portfolio', () => {
    it('returns an empty portfolio when no transactions exist', async () => {
      const response = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = response.body as {
        positions: unknown[];
        totalValue: number;
      };
      expect(body.positions).toHaveLength(0);
      expect(body.totalValue).toBe(0);
    });

    it('returns positions with current price, avgCost and P&L', async () => {
      await seedTransaction({
        ticker: 'AAPL',
        quantity: 10,
        price: AAPL_PRICE,
        date: '2025-01-15',
      });

      const response = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = response.body as {
        positions: {
          ticker: string;
          quantity: number;
          avgCost: number;
          currentPrice: number;
          pnl: number;
          hasPrice: boolean;
        }[];
        totalValue: number;
        lastPriceUpdate: string;
      };

      expect(body.positions).toHaveLength(1);
      const pos = body.positions[0];
      expect(pos.ticker).toBe('AAPL');
      expect(pos.quantity).toBe(10);
      expect(pos.avgCost).toBe(AAPL_PRICE);
      expect(pos.currentPrice).toBe(AAPL_PRICE);
      expect(pos.pnl).toBe(0);
      expect(pos.hasPrice).toBe(true);
      expect(body.totalValue).toBe(AAPL_PRICE * 10);
      expect(body.lastPriceUpdate).toBeDefined();
    });

    it('reflects correct avgCost after multiple buys at different prices', async () => {
      await seedTransaction({
        ticker: 'AAPL',
        quantity: 10,
        price: 200,
        date: '2025-01-15',
      });
      await seedTransaction({
        ticker: 'AAPL',
        quantity: 10,
        price: 300,
        date: '2025-03-01',
      });

      const response = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const pos = (
        response.body as { positions: { avgCost: number; quantity: number }[] }
      ).positions[0];
      expect(pos.quantity).toBe(20);
      expect(pos.avgCost).toBe((200 * 10 + 300 * 10) / 20);
    });

    it('resets avgCost after a full position close and re-buy', async () => {
      await seedTransaction({
        ticker: 'AAPL',
        quantity: 10,
        price: 200,
        date: '2025-01-15',
      });
      await seedTransaction({
        ticker: 'AAPL',
        type: TransactionType.SELL,
        quantity: 10,
        price: 250,
        date: '2025-03-01',
      });
      await seedTransaction({
        ticker: 'AAPL',
        quantity: 20,
        price: 300,
        date: '2025-06-01',
      });

      const response = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const pos = (
        response.body as { positions: { avgCost: number; quantity: number }[] }
      ).positions[0];
      expect(pos.quantity).toBe(20);
      expect(pos.avgCost).toBe(300);
    });

    it('does not expose positions of another user', async () => {
      await register(app, {
        name: 'Ana',
        email: 'ana@email.com',
        password: 'Password1!',
      });
      const ana = await prisma.user.findUniqueOrThrow({
        where: { email: 'ana@email.com' },
      });

      await seedTransaction({
        userId: ana.id,
        ticker: 'MSFT',
        quantity: 5,
        price: MSFT_PRICE,
        date: '2025-01-15',
      });

      const response = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = response.body as { positions: { ticker: string }[] };
      expect(body.positions.some((p) => p.ticker === 'MSFT')).toBe(false);
    });

    it('returns 401 without a token', async () => {
      await request(getHttpServer(app)).get('/portfolio').expect(401);
    });
  });
});
