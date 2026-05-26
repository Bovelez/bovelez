import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { getHttpServer } from '../../../utils/http-server';
import { EDGAR_CLIENT } from '../../../../src/modules/edgar/interfaces/edgar.interface';

const mockEdgarClient = {
  getCompanies: jest.fn(),
  getCompanyByTicker: jest.fn(),
};

const edgarCompanies = [
  { cik: '320193', ticker: 'AAPL', name: 'Apple Inc.' },
  { cik: '789019', ticker: 'MSFT', name: 'Microsoft Corp.' },
  { cik: '1318605', ticker: 'TSLA', name: 'Tesla Inc.' },
];

describe('Edgar Integration', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EDGAR_CLIENT)
      .useValue(mockEdgarClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = new PrismaClient();
    await prisma.edgarCompany.deleteMany();
    await prisma.stockPrice.deleteMany();
    await prisma.priceBatchRun.deleteMany();
  });

  beforeEach(() => {
    mockEdgarClient.getCompanies.mockResolvedValue(edgarCompanies);
    mockEdgarClient.getCompanyByTicker.mockImplementation((ticker: string) => {
      const company = edgarCompanies.find(
        (item) => item.ticker === ticker.toUpperCase(),
      );

      if (!company) throw new Error(`Ticker ${ticker} not found`);
      return company;
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.edgarCompany.deleteMany();
      await prisma.stockPrice.deleteMany();
      await prisma.priceBatchRun.deleteMany();
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  describe('GET /prices/search', () => {
    it('should return results from EDGAR Full-Text Search API', async () => {
      const response = await request(getHttpServer(app))
        .get('/edgar/search?q=apple')
        .expect(200);

      const body = response.body as unknown[];
      expect(Array.isArray(body)).toBe(true);
    }, 15000);

    it('should return empty array for an unrecognized query', async () => {
      const response = await request(getHttpServer(app))
        .get('/edgar/search?q=zzznomatchxyz99999')
        .expect(200);

      const body = response.body as unknown[];
      expect(Array.isArray(body)).toBe(true);
    }, 15000);
  });

  describe('PATCH /prices/companies/:ticker/sync', () => {
    it('should fetch company from EDGAR and persist it in the database', async () => {
      await request(getHttpServer(app))
        .patch('/edgar/companies/AAPL/sync')
        .expect(200);

      const record = await prisma.edgarCompany.findUnique({
        where: { ticker: 'AAPL' },
      });
      expect(record).not.toBeNull();
      expect(record?.ticker).toBe('AAPL');
      expect(record?.cik).toBeDefined();
      expect(record?.name).toBeDefined();
    }, 15000);

    it('should update the record when syncing the same ticker again', async () => {
      const before = await prisma.edgarCompany.findUnique({
        where: { ticker: 'AAPL' },
      });

      await request(getHttpServer(app))
        .patch('/edgar/companies/AAPL/sync')
        .expect(200);

      const after = await prisma.edgarCompany.findUnique({
        where: { ticker: 'AAPL' },
      });

      expect(after).not.toBeNull();
      expect(after?.cik).toBe(before?.cik);
    }, 15000);
  });

  describe('GET /prices/companies', () => {
    beforeEach(async () => {
      await prisma.stockPrice.deleteMany();
      await seedStockPrices(['AAPL', 'MSFT']);
    });

    it('should return only EDGAR companies with seeded prices', async () => {
      const response = await request(getHttpServer(app))
        .get('/edgar/companies')
        .expect(200);

      const body = response.body as Array<{ ticker: string }>;
      expect(Array.isArray(body)).toBe(true);
      const tickers = body.map((c) => c.ticker);
      expect(tickers).toEqual(['AAPL', 'MSFT']);
      expect(tickers).not.toContain('TSLA');
    });

    it('should return an empty list when prices have not been seeded', async () => {
      await prisma.stockPrice.deleteMany();

      const response = await request(getHttpServer(app))
        .get('/edgar/companies')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /prices/companies/:ticker', () => {
    beforeEach(async () => {
      await seedEdgarCompany('AAPL');
    });

    it('should return a company that was previously synced', async () => {
      const response = await request(getHttpServer(app))
        .get('/edgar/companies/AAPL')
        .expect(200);

      const body = response.body as {
        ticker: string;
        cik: string;
        name: string;
      };
      expect(body.ticker).toBe('AAPL');
      expect(body.cik).toBeDefined();
      expect(body.name).toBeDefined();
    });

    it('should return 404 for a ticker that was never synced', async () => {
      await request(getHttpServer(app))
        .get('/edgar/companies/ZZZNOPE')
        .expect(404);
    });
  });

  describe('GET /prices/companies/:ticker/filings', () => {
    it('should return recent 10-K and 10-Q filings from EDGAR', async () => {
      const response = await request(getHttpServer(app))
        .get('/edgar/companies/AAPL/filings')
        .expect(200);

      const body = response.body as unknown[];
      expect(Array.isArray(body)).toBe(true);
    }, 30000);
  });

  describe('GET /prices/companies/:ticker/metrics', () => {
    it('should return financial metrics from EDGAR XBRL API', async () => {
      const response = await request(getHttpServer(app))
        .get('/edgar/companies/AAPL/metrics?quarters=4')
        .expect(200);

      const body = response.body as Record<string, unknown>;
      expect(body).toBeDefined();
    }, 30000);
  });

  async function seedStockPrices(tickers: string[]): Promise<void> {
    await prisma.stockPrice.createMany({
      data: tickers.map((ticker, index) => ({
        ticker,
        price: 100 + index,
      })),
    });
  }

  async function seedEdgarCompany(ticker: string): Promise<void> {
    const company = edgarCompanies.find((item) => item.ticker === ticker);
    if (!company) throw new Error(`Missing test company ${ticker}`);

    await prisma.edgarCompany.upsert({
      where: { ticker: company.ticker },
      update: company,
      create: company,
    });
  }
});
