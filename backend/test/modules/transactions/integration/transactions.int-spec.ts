import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient, TransactionType } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { YAHOO_FINANCE_CLIENT } from '../../../../src/modules/prices/interfaces/prices.interface';
import { getHttpServer } from '../../../utils/http-server';
import { login } from '../../../utils/login';
import { register } from '../../../utils/register';

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

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayInputValue(): string {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

function tomorrowInputValue(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

describe('Transactions Integration', () => {
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

  describe('POST /transactions/buy', () => {
    it('creates a BUY transaction at the latest stored price', async () => {
      const response = await request(getHttpServer(app))
        .post('/transactions/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: todayInputValue() })
        .expect(201);

      const body = response.body as Record<string, unknown>;
      expect(body.ticker).toBe('AAPL');
      expect(body.type).toBe('BUY');
      expect(body.quantity).toBe(10);
      expect(body.price).toBe(AAPL_PRICE);

      const transaction = await prisma.transaction.findUniqueOrThrow({
        where: { id: body.id as string },
      });
      expect(transaction.userId).toBe(userId);
      expect(transaction.price).toBe(AAPL_PRICE);
    });

    it('returns 400 for an invalid ticker', async () => {
      mockEdgarService.isValidTicker.mockResolvedValueOnce(false);

      await request(getHttpServer(app))
        .post('/transactions/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'FAKE', quantity: 10, date: todayInputValue() })
        .expect(400);

      expect(await prisma.transaction.count()).toBe(0);
    });

    it('returns 400 when no stored price exists for the ticker', async () => {
      await request(getHttpServer(app))
        .post('/transactions/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'NVDA', quantity: 5, date: todayInputValue() })
        .expect(400);

      expect(await prisma.transaction.count()).toBe(0);
    });

    it('returns 400 when buying before today', async () => {
      await request(getHttpServer(app))
        .post('/transactions/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 1, date: yesterdayInputValue() })
        .expect(400);

      expect(await prisma.transaction.count()).toBe(0);
    });

    it('returns 400 when buying after today', async () => {
      await request(getHttpServer(app))
        .post('/transactions/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 1, date: tomorrowInputValue() })
        .expect(400);

      expect(await prisma.transaction.count()).toBe(0);
    });

    it('returns 400 for invalid request body', async () => {
      const response = await request(getHttpServer(app))
        .post('/transactions/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: '', quantity: 0 })
        .expect(400);

      const messages = (response.body as { message: string[] }).message;
      expect(messages.some((message) => /ticker/i.test(message))).toBe(true);
      expect(messages.some((message) => /quantity/i.test(message))).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      await request(getHttpServer(app))
        .post('/transactions/buy')
        .send({ ticker: 'AAPL', quantity: 10, date: todayInputValue() })
        .expect(401);
    });
  });

  describe('POST /transactions/sell', () => {
    beforeEach(async () => {
      await seedTransaction({
        ticker: 'AAPL',
        quantity: 10,
        price: AAPL_PRICE,
        date: '2025-01-15',
      });
    });

    it('creates a SELL transaction at the latest stored price', async () => {
      const response = await request(getHttpServer(app))
        .post('/transactions/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 4, date: todayInputValue() })
        .expect(201);

      const body = response.body as Record<string, unknown>;
      expect(body.ticker).toBe('AAPL');
      expect(body.type).toBe('SELL');
      expect(body.quantity).toBe(4);
      expect(body.price).toBe(AAPL_PRICE);

      const transactions = await prisma.transaction.findMany({
        where: { userId, ticker: 'AAPL' },
      });
      expect(transactions).toHaveLength(2);
    });

    it('returns 400 when selling more shares than currently held', async () => {
      await request(getHttpServer(app))
        .post('/transactions/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 11, date: todayInputValue() })
        .expect(400);

      expect(await prisma.transaction.count({ where: { userId } })).toBe(1);
    });

    it('returns 400 when no open position exists for the ticker', async () => {
      await request(getHttpServer(app))
        .post('/transactions/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'MSFT', quantity: 1, date: todayInputValue() })
        .expect(400);
    });

    it('returns 400 when selling before today', async () => {
      await request(getHttpServer(app))
        .post('/transactions/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 1, date: yesterdayInputValue() })
        .expect(400);

      expect(await prisma.transaction.count({ where: { userId } })).toBe(1);
    });

    it('returns 400 when selling after today', async () => {
      await request(getHttpServer(app))
        .post('/transactions/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 1, date: tomorrowInputValue() })
        .expect(400);

      expect(await prisma.transaction.count({ where: { userId } })).toBe(1);
    });

    it('returns 400 when the sell ticker has no stored price', async () => {
      await prisma.stockPrice.delete({ where: { ticker: 'AAPL' } });

      await request(getHttpServer(app))
        .post('/transactions/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 1, date: todayInputValue() })
        .expect(400);

      expect(await prisma.transaction.count({ where: { userId } })).toBe(1);
    });

    it('deletes all ticker transactions when selling the full position', async () => {
      await request(getHttpServer(app))
        .post('/transactions/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: todayInputValue() })
        .expect(201);

      const transactions = await prisma.transaction.findMany({
        where: { userId, ticker: 'AAPL' },
      });
      expect(transactions).toHaveLength(0);
    });

    it('returns 401 without authentication', async () => {
      await request(getHttpServer(app))
        .post('/transactions/sell')
        .send({ ticker: 'AAPL', quantity: 1, date: todayInputValue() })
        .expect(401);
    });
  });

  describe('GET /transactions/:ticker', () => {
    it('returns only the authenticated user transactions for the requested ticker', async () => {
      await seedTransaction({
        ticker: 'AAPL',
        quantity: 10,
        price: AAPL_PRICE,
        date: '2025-01-15',
      });
      await seedTransaction({
        ticker: 'MSFT',
        quantity: 2,
        price: MSFT_PRICE,
        date: '2025-01-16',
      });

      const response = await request(getHttpServer(app))
        .get('/transactions/aapl')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = response.body as { ticker: string; quantity: number }[];
      expect(body).toHaveLength(1);
      expect(body[0].ticker).toBe('AAPL');
      expect(body[0].quantity).toBe(10);
    });

    it('does not expose another user transactions', async () => {
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
        ticker: 'AAPL',
        quantity: 3,
        price: AAPL_PRICE,
        date: '2025-01-15',
      });

      const response = await request(getHttpServer(app))
        .get('/transactions/AAPL')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns an empty array when the user has no transactions for that ticker', async () => {
      const response = await request(getHttpServer(app))
        .get('/transactions/MSFT')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns 401 without authentication', async () => {
      await request(getHttpServer(app)).get('/transactions/AAPL').expect(401);
    });
  });
});
