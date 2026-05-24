import { PricesStartupSeeder } from '../../../../src/modules/prices/seed/prices-startup-seeder.service';
import { SPY_TICKERS } from '../../../../src/modules/prices/seed/spy-tickers';

const mockRepository = {
  countPrices: jest.fn(),
  findTickersMissingDailyChangePercent: jest.fn(),
};

const mockPricesService = {
  runBatch: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('PricesStartupSeeder', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let seeder: PricesStartupSeeder;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    mockConfigService.get.mockImplementation(
      (_key: string, defaultValue?: string) => defaultValue,
    );
    mockRepository.findTickersMissingDailyChangePercent.mockResolvedValue([]);

    seeder = new PricesStartupSeeder(
      mockRepository as never,
      mockPricesService as never,
      mockConfigService as never,
    );
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('runs a price batch for the static SPY tickers when StockPrice is empty', async () => {
    mockRepository.countPrices.mockResolvedValue(0);
    mockPricesService.runBatch.mockResolvedValue({ tickerCount: 50, errorCount: 0 });

    await seeder.runSeed();

    expect(mockRepository.countPrices).toHaveBeenCalled();
    // tickers are sent in chunks of 50 — verify all tickers are covered across all calls
    const allCalledTickers = mockPricesService.runBatch.mock.calls.flat(2) as string[];
    expect(allCalledTickers).toEqual(expect.arrayContaining([...SPY_TICKERS]));
    expect(allCalledTickers).toHaveLength(SPY_TICKERS.length);
  });

  it('uses configured SPY_TICKERS when provided', async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'SPY_TICKERS' ? ' msft, AAPL, brk.b, AAPL ' : 'true',
    );
    mockRepository.countPrices.mockResolvedValue(0);
    mockPricesService.runBatch.mockResolvedValue({ tickerCount: 3, errorCount: 0 });

    await seeder.runSeed();

    // 3 tickers fit in one chunk
    expect(mockPricesService.runBatch).toHaveBeenCalledTimes(1);
    expect(mockPricesService.runBatch).toHaveBeenCalledWith(['AAPL', 'BRK-B', 'MSFT']);
  });

  it('skips startup seeding when StockPrice already has records', async () => {
    mockRepository.countPrices.mockResolvedValue(1);
    mockRepository.findTickersMissingDailyChangePercent.mockResolvedValue([]);

    await seeder.runSeed();

    expect(mockPricesService.runBatch).not.toHaveBeenCalled();
  });

  it('refreshes existing prices that are missing daily change percent', async () => {
    mockRepository.countPrices.mockResolvedValue(2);
    mockRepository.findTickersMissingDailyChangePercent.mockResolvedValue([
      'AAPL',
      'MSFT',
    ]);
    mockPricesService.runBatch.mockResolvedValue({
      tickerCount: 2,
      errorCount: 0,
    });

    await seeder.runSeed();

    expect(mockPricesService.runBatch).toHaveBeenCalledTimes(1);
    expect(mockPricesService.runBatch).toHaveBeenCalledWith(['AAPL', 'MSFT']);
  });

  it('skips startup seeding during tests', () => {
    process.env.NODE_ENV = 'test';

    seeder.onApplicationBootstrap();

    expect(mockRepository.countPrices).not.toHaveBeenCalled();
    expect(mockPricesService.runBatch).not.toHaveBeenCalled();
  });

  it('skips startup seeding when disabled by configuration', () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'SEED_SPY_PRICES_ON_STARTUP' ? 'false' : undefined,
    );

    seeder.onApplicationBootstrap();

    expect(mockRepository.countPrices).not.toHaveBeenCalled();
    expect(mockPricesService.runBatch).not.toHaveBeenCalled();
  });
});
