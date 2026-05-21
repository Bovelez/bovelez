import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { register } from '../../../utils/register';
import { login } from '../../../utils/login';
import { getHttpServer } from '../../../utils/http-server';
import { YAHOO_FINANCE_CLIENT } from '../../../../src/modules/prices/interfaces/prices.interface';

const AAPL_PRICE = 200;
const MSFT_PRICE = 420;

const mockYahooClient = {
  fetchPrices: jest.fn().mockResolvedValue({
    prices: { AAPL: AAPL_PRICE, MSFT: MSFT_PRICE },
    errors: {},
  }),
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
    await (prisma as any).stockPrice.deleteMany();
    await (prisma as any).priceBatchRun.deleteMany();
    await prisma.user.deleteMany();

    await register(app, { name: 'Juan', email: 'juan@email.com', password: 'Password1!' });
    const loginResponse = await login(app, 'juan@email.com', 'Password1!');
    token = loginResponse.token;

    // Seed prices so buy/sell can look them up
    await request(getHttpServer(app))
      .post('/prices/update')
      .send({ tickers: ['AAPL', 'MSFT'] })
      .expect(201);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.transaction.deleteMany();
      await (prisma as any).stockPrice.deleteMany();
      await (prisma as any).priceBatchRun.deleteMany();
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  describe('POST /portfolio/buy', () => {
    it('creates a BUY transaction at the stored price', async () => {
      const response = await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-01-15' })
        .expect(201);

      const body = response.body as Record<string, unknown>;
      expect(body.ticker).toBe('AAPL');
      expect(body.type).toBe('BUY');
      expect(body.quantity).toBe(10);
      expect(body.price).toBe(AAPL_PRICE);
      expect(body.id).toBeDefined();

      const tx = await prisma.transaction.findUnique({ where: { id: body.id as string } });
      expect(tx).not.toBeNull();
      expect(tx!.price).toBe(AAPL_PRICE);
    });

    it('returns 400 for an invalid ticker', async () => {
      mockEdgarService.isValidTicker.mockResolvedValueOnce(false);

      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'FAKE', quantity: 10, date: '2025-01-15' })
        .expect(400);
    });

    it('returns 400 when no price is stored for the ticker', async () => {
      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'NVDA', quantity: 5, date: '2025-01-15' })
        .expect(400);
    });

    it('returns 401 without a token', async () => {
      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-01-15' })
        .expect(401);
    });

    it('returns 400 for invalid input', async () => {
      const response = await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: '', quantity: 0 })
        .expect(400);

      const messages = (response.body as { message: string[] }).message;
      expect(messages.some((m) => /ticker/i.test(m))).toBe(true);
      expect(messages.some((m) => /quantity/i.test(m))).toBe(true);
    });
  });

  describe('POST /portfolio/sell', () => {
    beforeEach(async () => {
      // Buy 10 AAPL before each sell test
      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-01-15' })
        .expect(201);
    });

    it('creates a SELL transaction at the stored price', async () => {
      const response = await request(getHttpServer(app))
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 5, date: '2025-06-01' })
        .expect(201);

      const body = response.body as Record<string, unknown>;
      expect(body.ticker).toBe('AAPL');
      expect(body.type).toBe('SELL');
      expect(body.quantity).toBe(5);
      expect(body.price).toBe(AAPL_PRICE);
    });

    it('returns 400 when selling more than held', async () => {
      await request(getHttpServer(app))
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 20, date: '2025-06-01' })
        .expect(400);
    });

    it('returns 400 when no open position exists for the ticker', async () => {
      await request(getHttpServer(app))
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'MSFT', quantity: 5, date: '2025-06-01' })
        .expect(400);
    });

    it('returns 401 without a token', async () => {
      await request(getHttpServer(app))
        .post('/portfolio/sell')
        .send({ ticker: 'AAPL', quantity: 5, date: '2025-06-01' })
        .expect(401);
    });

    it('allows selling the full position', async () => {
      await request(getHttpServer(app))
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-06-01' })
        .expect(201);

      // Portfolio should now be empty
      const portfolio = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect((portfolio.body as { positions: unknown[] }).positions).toHaveLength(0);
    });
  });

  describe('GET /portfolio', () => {
    it('returns an empty portfolio when no transactions exist', async () => {
      const response = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = response.body as { positions: unknown[]; totalValue: number };
      expect(body.positions).toHaveLength(0);
      expect(body.totalValue).toBe(0);
    });

    it('returns positions with current price, avgCost and P&L', async () => {
      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-01-15' })
        .expect(201);

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
      // First buy at stored price (200)
      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-01-15' })
        .expect(201);

      // Update price to 300 then buy again
      mockYahooClient.fetchPrices.mockResolvedValueOnce({
        prices: { AAPL: 300, MSFT: MSFT_PRICE },
        errors: {},
      });
      await request(getHttpServer(app))
        .post('/prices/update')
        .send({ tickers: ['AAPL', 'MSFT'] })
        .expect(201);

      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-03-01' })
        .expect(201);

      const response = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const pos = (response.body as { positions: { avgCost: number; quantity: number }[] }).positions[0];
      expect(pos.quantity).toBe(20);
      expect(pos.avgCost).toBe((200 * 10 + 300 * 10) / 20); // 250
    });

    it('resets avgCost after a full position close and re-buy', async () => {
      // Buy 10 @ 200
      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-01-15' })
        .expect(201);

      // Sell all 10
      await request(getHttpServer(app))
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2025-03-01' })
        .expect(201);

      // Update price to 300
      mockYahooClient.fetchPrices.mockResolvedValueOnce({
        prices: { AAPL: 300, MSFT: MSFT_PRICE },
        errors: {},
      });
      await request(getHttpServer(app))
        .post('/prices/update')
        .send({ tickers: ['AAPL', 'MSFT'] })
        .expect(201);

      // Buy 20 @ 300 — cost basis should be 300 only, not blended with old 200
      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 20, date: '2025-06-01' })
        .expect(201);

      const response = await request(getHttpServer(app))
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const pos = (response.body as { positions: { avgCost: number; quantity: number }[] }).positions[0];
      expect(pos.quantity).toBe(20);
      expect(pos.avgCost).toBe(300);
    });

    it('does not expose positions of another user', async () => {
      await register(app, { name: 'Ana', email: 'ana@email.com', password: 'Password1!' });
      const anaLogin = await login(app, 'ana@email.com', 'Password1!');

      // Ana buys MSFT
      await request(getHttpServer(app))
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${anaLogin.token}`)
        .send({ ticker: 'MSFT', quantity: 5, date: '2025-01-15' })
        .expect(201);

      // Juan's portfolio should not include Ana's MSFT
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
