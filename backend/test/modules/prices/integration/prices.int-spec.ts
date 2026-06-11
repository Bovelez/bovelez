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
      expect(aapl?.price).toBe(200.5);
      expect(aapl?.dailyChangePercent).toBe(1.25);
      expect(msft).not.toBeNull();
      expect(msft?.price).toBe(420.0);
      expect(msft?.dailyChangePercent).toBe(-0.5);

      const batchRun = await prisma.priceBatchRun.findUnique({
        where: { id: body.batchId as string },
      });
      expect(batchRun).not.toBeNull();
      expect(batchRun?.tickerCount).toBe(2);
      expect(batchRun?.errorCount).toBe(0);
      expect(batchRun?.finishedAt).not.toBeNull();
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
      expect(aapl?.price).toBe(999.99);
      expect(aapl?.dailyChangePercent).toBe(2.75);
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
      expect(batchRun?.errorCount).toBe(1);
      expect((batchRun?.errors as Record<string, string>).FAKE).toBe(
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
      expect(dbRecord?.tickerCount).toBe(body.tickerCount);
    });
  });
});

const REAL_TICKERS = ['AAPL', 'MSFT'];
const INVALID_TICKER = 'ZZZZINVALIDTICKER';
const ALL_REAL_SUITE_TICKERS = [...REAL_TICKERS, INVALID_TICKER];
const PRICE_SERVICE_URL =
  process.env.PRICE_SERVICE_URL ?? 'http://localhost:8000';
const REAL_SUITE_TIMEOUT = 120_000;

describe('Prices Integration (real Yahoo Finance via price-service)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let batchId: string | undefined;

  beforeAll(async () => {
    // Preflight with a clear message instead of an opaque 502 later.
    try {
      const health = await fetch(`${PRICE_SERVICE_URL}/health`);
      if (!health.ok) throw new Error(`health returned ${health.status}`);
    } catch (error) {
      throw new Error(
        `price-service is not reachable at ${PRICE_SERVICE_URL}. ` +
          'Run "npm run integration:docker:up" (it starts the price-service) ' +
          `before running this suite. Original error: ${String(error)}`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = new PrismaClient();
    await prisma.stockPrice.deleteMany({
      where: { ticker: { in: ALL_REAL_SUITE_TICKERS } },
    });
  }, REAL_SUITE_TIMEOUT);

  afterAll(async () => {
    if (prisma) {
      await prisma.stockPrice.deleteMany({
        where: { ticker: { in: ALL_REAL_SUITE_TICKERS } },
      });
      if (batchId) {
        await prisma.priceBatchRun.deleteMany({ where: { id: batchId } });
      }
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  it(
    'fetches real prices from Yahoo Finance, persists them, and registers errors without interrupting',
    async () => {
      const response = await request(getHttpServer(app))
        .post('/prices/update')
        .send({ tickers: ALL_REAL_SUITE_TICKERS })
        .expect(201);

      const body = response.body as {
        batchId: string;
        startedAt: string;
        finishedAt: string;
        tickerCount: number;
        errorCount: number;
        prices: Record<string, number>;
        errors: Record<string, string>;
      };
      batchId = body.batchId;

      // Every ticker is accounted for: either a price or a registered error.
      expect(body.tickerCount + body.errorCount).toBe(
        ALL_REAL_SUITE_TICKERS.length,
      );

      // Real integration: at least one known ticker must come back with a
      // real, positive price from Yahoo Finance.
      expect(body.tickerCount).toBeGreaterThanOrEqual(1);
      for (const ticker of Object.keys(body.prices)) {
        expect(REAL_TICKERS).toContain(ticker);
        expect(body.prices[ticker]).toBeGreaterThan(0);
      }

      // The invalid ticker is registered as an error and does not interrupt
      // the rest of the batch.
      expect(body.errors[INVALID_TICKER]).toBeDefined();

      // Prices are persisted with their update timestamp.
      const stored = await prisma.stockPrice.findMany({
        where: { ticker: { in: REAL_TICKERS } },
      });
      expect(stored.length).toBe(body.tickerCount);
      for (const record of stored) {
        expect(record.price).toBeGreaterThan(0);
        expect(record.updatedAt).toBeInstanceOf(Date);
      }

      // The invalid ticker is never persisted.
      const invalid = await prisma.stockPrice.findUnique({
        where: { ticker: INVALID_TICKER },
      });
      expect(invalid).toBeNull();

      // The batch run is recorded with timestamps and the per-ticker errors.
      const run = await prisma.priceBatchRun.findUnique({
        where: { id: body.batchId },
      });
      expect(run).not.toBeNull();
      expect(run?.finishedAt).not.toBeNull();
      expect(run?.tickerCount).toBe(body.tickerCount);
      expect(run?.errorCount).toBeGreaterThanOrEqual(1);
    },
    REAL_SUITE_TIMEOUT,
  );

  it('exposes the timestamp of the last real update via GET /prices/last-run', async () => {
    const response = await request(getHttpServer(app))
      .get('/prices/last-run')
      .expect(200);

    const body = response.body as {
      id: string;
      startedAt: string;
      finishedAt: string | null;
    };
    expect(body.id).toBeDefined();
    expect(body.startedAt).toBeDefined();
    expect(body.finishedAt).not.toBeNull();
  });
});
