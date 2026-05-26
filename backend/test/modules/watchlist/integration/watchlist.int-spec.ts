import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { YAHOO_FINANCE_CLIENT } from '../../../../src/modules/prices/interfaces/prices.interface';
import { getHttpServer } from '../../../utils/http-server';
import { login } from '../../../utils/login';
import { register } from '../../../utils/register';

const AAPL_PRICE = 200;
const MSFT_PRICE = 420;
const GOOGL_PRICE = 175;

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

describe('Watchlist Integration', () => {
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
    mockEdgarService.isValidTicker.mockResolvedValue(true);
    mockEdgarService.getCompany.mockResolvedValue(null);
    mockEdgarService.getMetrics.mockResolvedValue({
      cik: '320193',
      name: 'Apple Inc.',
      metrics: {
        revenue: [
          {
            quarter: 'Q1 2024',
            value: 119575000000,
            unit: 'USD',
            filedAt: '2024-02-02',
          },
        ],
        netIncome: [
          {
            quarter: 'Q1 2024',
            value: 33916000000,
            unit: 'USD',
            filedAt: '2024-02-02',
          },
        ],
        eps: [
          {
            quarter: 'Q1 2024',
            value: 2.18,
            unit: 'USD',
            filedAt: '2024-02-02',
          },
        ],
        totalAssets: [
          {
            quarter: 'Q1 2024',
            value: 353514000000,
            unit: 'USD',
            filedAt: '2024-02-02',
          },
        ],
        totalLiabilities: [
          {
            quarter: 'Q1 2024',
            value: 279414000000,
            unit: 'USD',
            filedAt: '2024-02-02',
          },
        ],
      },
    });

    await prisma.watchlistItem.deleteMany();
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
    await seedPrice('GOOGL', GOOGL_PRICE);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.watchlistItem.deleteMany();
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
  async function seedWatchlistItems(
    tickers: string[],
    forUserId = userId,
  ): Promise<void> {
    await prisma.watchlistItem.createMany({
      data: tickers.map((ticker) => ({ userId: forUserId, ticker })),
    });
  }

  async function seedWatchlistItem(
    ticker: string,
    forUserId = userId,
  ): Promise<void> {
    await prisma.watchlistItem.create({
      data: { userId: forUserId, ticker },
    });
  }

  // ── POST /watchlist ────────────────────────────────────────────────────────

  describe('POST /watchlist', () => {
    it('adds a ticker to the watchlist and returns 201', async () => {
      const response = await request(getHttpServer(app))
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' })
        .expect(201);

      const body = response.body as Record<string, unknown>;
      expect(body.ticker).toBe('AAPL');
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();

      const item = await prisma.watchlistItem.findFirst({
        where: { userId, ticker: 'AAPL' },
      });
      expect(item).not.toBeNull();
    });

    it('normalizes ticker to uppercase before persisting', async () => {
      await request(getHttpServer(app))
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'aapl' })
        .expect(201);

      const item = await prisma.watchlistItem.findFirst({
        where: { userId, ticker: 'AAPL' },
      });
      expect(item).not.toBeNull();
    });

    it('returns 409 when the ticker is already in the watchlist', async () => {
      await seedWatchlistItem('AAPL');

      await request(getHttpServer(app))
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' })
        .expect(409);

      expect(await prisma.watchlistItem.count({ where: { userId } })).toBe(1);
    });

    it('returns 404 when the ticker does not exist in SEC EDGAR', async () => {
      mockEdgarService.isValidTicker.mockResolvedValueOnce(false);

      await request(getHttpServer(app))
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'FAKE' })
        .expect(404);

      expect(await prisma.watchlistItem.count({ where: { userId } })).toBe(0);
    });

    it('returns 422 when the watchlist is full (20 items)', async () => {
      const tickers = Array.from(
        { length: 20 },
        (_, i) => `T${String(i).padStart(2, '0')}`,
      );
      await seedWatchlistItems(tickers);

      await request(getHttpServer(app))
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' })
        .expect(422);

      expect(await prisma.watchlistItem.count({ where: { userId } })).toBe(20);
    });

    it('returns 400 for an invalid ticker format', async () => {
      const response = await request(getHttpServer(app))
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: '' })
        .expect(400);

      const messages = (response.body as { message: string[] }).message;
      expect(messages.some((m) => /ticker/i.test(m))).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      await request(getHttpServer(app))
        .post('/watchlist')
        .send({ ticker: 'AAPL' })
        .expect(401);
    });

    it('does not add the same ticker to another user watchlist', async () => {
      await register(app, {
        name: 'Ana',
        email: 'ana@email.com',
        password: 'Password1!',
      });
      const ana = await prisma.user.findUniqueOrThrow({
        where: { email: 'ana@email.com' },
      });
      await seedWatchlistItem('AAPL', ana.id);

      await request(getHttpServer(app))
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' })
        .expect(201);

      expect(await prisma.watchlistItem.count({ where: { userId } })).toBe(1);
    });
  });

  // ── DELETE /watchlist/:ticker ──────────────────────────────────────────────

  describe('DELETE /watchlist/:ticker', () => {
    beforeEach(async () => {
      await seedWatchlistItem('AAPL');
    });

    it('removes the ticker and returns 204', async () => {
      await request(getHttpServer(app))
        .delete('/watchlist/AAPL')
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const item = await prisma.watchlistItem.findFirst({
        where: { userId, ticker: 'AAPL' },
      });
      expect(item).toBeNull();
    });

    it('returns 404 when the ticker is not in the watchlist', async () => {
      await request(getHttpServer(app))
        .delete('/watchlist/MSFT')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('does not remove a ticker belonging to another user', async () => {
      await register(app, {
        name: 'Ana',
        email: 'ana@email.com',
        password: 'Password1!',
      });
      const anaLogin = await login(app, 'ana@email.com', 'Password1!');

      // Ana tries to delete Juan's AAPL — should get 404 (not found in Ana's list)
      await request(getHttpServer(app))
        .delete('/watchlist/AAPL')
        .set('Authorization', `Bearer ${anaLogin.token}`)
        .expect(404);

      expect(
        await prisma.watchlistItem.findFirst({
          where: { userId, ticker: 'AAPL' },
        }),
      ).not.toBeNull();
    });

    it('does not affect existing transactions when removing a ticker', async () => {
      await prisma.transaction.create({
        data: {
          userId,
          ticker: 'AAPL',
          type: 'BUY',
          quantity: 10,
          price: AAPL_PRICE,
          date: new Date(),
        },
      });

      await request(getHttpServer(app))
        .delete('/watchlist/AAPL')
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const transactions = await prisma.transaction.findMany({
        where: { userId, ticker: 'AAPL' },
      });
      expect(transactions).toHaveLength(1);
    });

    it('returns 401 without authentication', async () => {
      await request(getHttpServer(app)).delete('/watchlist/AAPL').expect(401);
    });
  });

  // ── GET /watchlist ─────────────────────────────────────────────────────────

  describe('GET /watchlist', () => {
    it('returns an empty array when the watchlist is empty', async () => {
      const response = await request(getHttpServer(app))
        .get('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns all watchlist items for the authenticated user', async () => {
      await seedWatchlistItem('AAPL');
      await seedWatchlistItem('MSFT');

      const response = await request(getHttpServer(app))
        .get('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = response.body as { ticker: string }[];
      expect(body).toHaveLength(2);
      const tickers = body.map((i) => i.ticker);
      expect(tickers).toContain('AAPL');
      expect(tickers).toContain('MSFT');
    });

    it('does not expose items belonging to another user', async () => {
      await register(app, {
        name: 'Ana',
        email: 'ana@email.com',
        password: 'Password1!',
      });
      const ana = await prisma.user.findUniqueOrThrow({
        where: { email: 'ana@email.com' },
      });
      await seedWatchlistItem('GOOGL', ana.id);

      const response = await request(getHttpServer(app))
        .get('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns 401 without authentication', async () => {
      await request(getHttpServer(app)).get('/watchlist').expect(401);
    });
  });

  // ── POST /watchlist/compare ────────────────────────────────────────────────

  describe('POST /watchlist/compare', () => {
    beforeEach(async () => {
      await seedWatchlistItem('AAPL');
      await seedWatchlistItem('MSFT');
    });

    it('returns metrics for two tickers in the watchlist', async () => {
      mockEdgarService.getMetrics
        .mockResolvedValueOnce({
          cik: '320193',
          name: 'Apple Inc.',
          metrics: {
            revenue: [
              {
                quarter: 'Q1 2024',
                value: 119575000000,
                unit: 'USD',
                filedAt: '2024-02-02',
              },
            ],
            netIncome: [],
            eps: [],
            totalAssets: [],
            totalLiabilities: [],
          },
        })
        .mockResolvedValueOnce({
          cik: '789019',
          name: 'Microsoft Corporation',
          metrics: {
            revenue: [
              {
                quarter: 'Q2 2024',
                value: 62020000000,
                unit: 'USD',
                filedAt: '2024-01-30',
              },
            ],
            netIncome: [],
            eps: [],
            totalAssets: [],
            totalLiabilities: [],
          },
        });

      const response = await request(getHttpServer(app))
        .post('/watchlist/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({ tickers: ['AAPL', 'MSFT'] })
        .expect(201);

      const body = response.body as {
        name: string;
        metrics: { revenue: unknown[] };
      }[];
      expect(body).toHaveLength(2);
      const names = body.map((r) => r.name);
      expect(names).toContain('Apple Inc.');
      expect(names).toContain('Microsoft Corporation');
    });

    it('returns an empty-metrics shell when a ticker has no data available', async () => {
      mockEdgarService.getMetrics
        .mockResolvedValueOnce({
          cik: '320193',
          name: 'Apple Inc.',
          metrics: {
            revenue: [],
            netIncome: [],
            eps: [],
            totalAssets: [],
            totalLiabilities: [],
          },
        })
        .mockRejectedValueOnce(new Error('EDGAR Facts unavailable'));

      const response = await request(getHttpServer(app))
        .post('/watchlist/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({ tickers: ['AAPL', 'MSFT'] })
        .expect(201);

      const body = response.body as { metrics: { revenue: unknown[] } }[];
      expect(body).toHaveLength(2);
      // Failed ticker gets empty arrays, not an error
      expect(body[1].metrics.revenue).toEqual([]);
    });

    it('returns 403 when a ticker in the list is not in the user watchlist', async () => {
      await request(getHttpServer(app))
        .post('/watchlist/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({ tickers: ['AAPL', 'GOOGL'] })
        .expect(403);
    });

    it('returns 400 when fewer than two tickers are provided', async () => {
      await request(getHttpServer(app))
        .post('/watchlist/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({ tickers: ['AAPL'] })
        .expect(400);
    });

    it('returns 401 without authentication', async () => {
      await request(getHttpServer(app))
        .post('/watchlist/compare')
        .send({ tickers: ['AAPL', 'MSFT'] })
        .expect(401);
    });
  });
});
