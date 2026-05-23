import { PricesStartupSeeder } from '../../../../src/modules/prices/seed/prices-startup-seeder.service';
import { SPY_TICKERS } from '../../../../src/modules/prices/seed/spy-tickers';

const mockRepository = {
  countPrices: jest.fn(),
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
    mockPricesService.runBatch.mockResolvedValue({
      tickerCount: SPY_TICKERS.length,
      errorCount: 0,
    });

    await seeder.onApplicationBootstrap();

    expect(mockRepository.countPrices).toHaveBeenCalled();
    expect(mockPricesService.runBatch).toHaveBeenCalledWith([...SPY_TICKERS]);
  });

  it('uses configured SPY_TICKERS when provided', async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'SPY_TICKERS' ? ' msft, AAPL, brk.b, AAPL ' : 'true',
    );
    mockRepository.countPrices.mockResolvedValue(0);
    mockPricesService.runBatch.mockResolvedValue({
      tickerCount: 3,
      errorCount: 0,
    });

    await seeder.onApplicationBootstrap();

    expect(mockPricesService.runBatch).toHaveBeenCalledWith([
      'AAPL',
      'BRK-B',
      'MSFT',
    ]);
  });

  it('skips startup seeding when StockPrice already has records', async () => {
    mockRepository.countPrices.mockResolvedValue(1);

    await seeder.onApplicationBootstrap();

    expect(mockPricesService.runBatch).not.toHaveBeenCalled();
  });

  it('skips startup seeding during tests', async () => {
    process.env.NODE_ENV = 'test';

    await seeder.onApplicationBootstrap();

    expect(mockRepository.countPrices).not.toHaveBeenCalled();
    expect(mockPricesService.runBatch).not.toHaveBeenCalled();
  });

  it('skips startup seeding when disabled by configuration', async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'SEED_SPY_PRICES_ON_STARTUP' ? 'false' : undefined,
    );

    await seeder.onApplicationBootstrap();

    expect(mockRepository.countPrices).not.toHaveBeenCalled();
    expect(mockPricesService.runBatch).not.toHaveBeenCalled();
  });
});
