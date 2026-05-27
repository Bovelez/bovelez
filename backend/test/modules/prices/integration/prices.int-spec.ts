import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { getHttpServer } from '../../../utils/http-server';
import { YAHOO_FINANCE_CLIENT } from '../../../../src/modules/prices/interfaces/prices.interface';

const mockYahooClient = {
  fetchPrices: jest.fn().mockResolvedValue({
    prices: { AAPL: 200.5, MSFT: 420.0 },
    dailyChangePercentages: { AAPL: 1.25, MSFT: -0.5 },
    errors: {},
  }),
};

describe('Prices Integration', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(YAHOO_FINANCE_CLIENT)
      .useValue(mockYahooClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = new PrismaClient();
    await prisma.stockPrice.deleteMany();
    await prisma.priceBatchRun.deleteMany();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.stockPrice.deleteMany();
      await prisma.priceBatchRun.deleteMany();
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  describe('POST /prices/update', () => {
    it('should persist prices and batch run in the database', async () => {
      const response = await request(getHttpServer(app))
        .post('/prices/update')
        .send({ tickers: ['AAPL', 'MSFT'] })
        .expect(201);

      const body = response.body as Record<string, unknown>;
      expect(body.batchId).toBeDefined();
      expect(body.tickerCount).toBe(2);
      expect(body.errorCount).toBe(0);
      expect(body.dailyChangePercentages).toEqual({
        AAPL: 1.25,
        MSFT: -0.5,
      });

      const aapl = await prisma.stockPrice.findUnique({
        where: { ticker: 'AAPL' },
      });
      const msft = await prisma.stockPrice.findUnique({
        where: { ticker: 'MSFT' },
      });
      expect(aapl).not.toBeNull();
      expect(aapl.price).toBe(200.5);
      expect(aapl.dailyChangePercent).toBe(1.25);
      expect(msft).not.toBeNull();
      expect(msft.price).toBe(420.0);
      expect(msft.dailyChangePercent).toBe(-0.5);

      const batchRun = await prisma.priceBatchRun.findUnique({
        where: { id: body.batchId as string },
      });
      expect(batchRun).not.toBeNull();
      expect(batchRun.tickerCount).toBe(2);
      expect(batchRun.errorCount).toBe(0);
      expect(batchRun.finishedAt).not.toBeNull();
    });

    it('should update an existing price when the same ticker is submitted again', async () => {
      mockYahooClient.fetchPrices.mockResolvedValueOnce({
        prices: { AAPL: 999.99 },
        dailyChangePercentages: { AAPL: 2.75 },
        errors: {},
      });

      await request(getHttpServer(app))
        .post('/prices/update')
        .send({ tickers: ['AAPL'] })
        .expect(201);

      const aapl = await prisma.stockPrice.findUnique({
        where: { ticker: 'AAPL' },
      });
      expect(aapl.price).toBe(999.99);
      expect(aapl.dailyChangePercent).toBe(2.75);
    });

    it('should register errors in the batch run without interrupting', async () => {
      mockYahooClient.fetchPrices.mockResolvedValueOnce({
        prices: { AAPL: 200.5 },
        dailyChangePercentages: { AAPL: null },
        errors: { FAKE: 'No data returned' },
      });

      const response = await request(getHttpServer(app))
        .post('/prices/update')
        .send({ tickers: ['AAPL', 'FAKE'] })
        .expect(201);

      const body = response.body as Record<string, unknown>;
      expect(body.tickerCount).toBe(1);
      expect(body.errorCount).toBe(1);

      const batchRun = await prisma.priceBatchRun.findUnique({
        where: { id: body.batchId as string },
      });
      expect(batchRun.errorCount).toBe(1);
      expect((batchRun.errors as Record<string, string>).FAKE).toBe(
        'No data returned',
      );

      const fake = await prisma.stockPrice.findUnique({
        where: { ticker: 'FAKE' },
      });
      expect(fake).toBeNull();
    });

    it('should return 400 when tickers list is empty', async () => {
      await request(getHttpServer(app))
        .post('/prices/update')
        .send({ tickers: [] })
        .expect(400);
    });
  });

  describe('GET /prices', () => {
    it('should return all prices stored in the database', async () => {
      const response = await request(getHttpServer(app))
        .get('/prices')
        .expect(200);

      const body = response.body as Array<{ ticker: string; price: number }>;
      expect(Array.isArray(body)).toBe(true);
      const tickers = body.map((p) => p.ticker);
      expect(tickers).toContain('AAPL');
      expect(tickers).toContain('MSFT');
      expect(body.find((p) => p.ticker === 'AAPL')).toHaveProperty(
        'dailyChangePercent',
      );
    });
  });

  describe('GET /prices/:ticker', () => {
    it('should return the stored price for a specific ticker', async () => {
      const response = await request(getHttpServer(app))
        .get('/prices/MSFT')
        .expect(200);

      const body = response.body as {
        ticker: string;
        price: number;
        dailyChangePercent: number | null;
        updatedAt: string;
      };
      expect(body.ticker).toBe('MSFT');
      expect(body.price).toBe(420.0);
      expect(body.dailyChangePercent).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('should return 404 for a ticker not in the database', async () => {
      await request(getHttpServer(app)).get('/prices/NOTEXISTS').expect(404);
    });
  });

  describe('GET /prices/last-run', () => {
    it('should return the most recent batch run with correct data', async () => {
      const response = await request(getHttpServer(app))
        .get('/prices/last-run')
        .expect(200);

      const body = response.body as {
        id: string;
        startedAt: string;
        finishedAt: string;
        tickerCount: number;
        errorCount: number;
      };
      expect(body.id).toBeDefined();
      expect(body.startedAt).toBeDefined();
      expect(body.finishedAt).toBeDefined();

      const dbRecord = await prisma.priceBatchRun.findUnique({
        where: { id: body.id },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.tickerCount).toBe(body.tickerCount);
    });
  });
});
