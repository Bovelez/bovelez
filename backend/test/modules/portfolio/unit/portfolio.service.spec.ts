import { PricesService } from '../../../../src/modules/prices/service/prices.service';
import { TransactionsService } from '../../../../src/modules/transactions/service/transactions.service';
import { PortfolioService } from '../../../../src/modules/portfolio/service/portfolio.service';

const USER_ID = 'user-1';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let transactionsService: jest.Mocked<
    Pick<TransactionsService, 'getOpenPositions'>
  >;
  let pricesService: jest.Mocked<
    Pick<PricesService, 'getPricesByTickers' | 'getLastBatchRun'>
  >;

  beforeEach(() => {
    transactionsService = {
      getOpenPositions: jest.fn(),
    };

    pricesService = {
      getPricesByTickers: jest.fn(),
      getLastBatchRun: jest.fn(),
    };

    service = new PortfolioService(
      transactionsService as unknown as TransactionsService,
      pricesService as unknown as PricesService,
    );
  });

  it('returns positions enriched with current price and P&L', async () => {
    transactionsService.getOpenPositions.mockResolvedValue([
      { ticker: 'AAPL', quantity: 10, avgCost: 200 },
    ]);
    pricesService.getLastBatchRun.mockResolvedValue({
      id: 'run-1',
      startedAt: new Date(),
      finishedAt: new Date(),
      tickerCount: 1,
      errorCount: 0,
      errors: null,
    });
    pricesService.getPricesByTickers.mockResolvedValue(
      new Map([['AAPL', 250]]),
    );

    const portfolio = await service.getPortfolio(USER_ID);

    expect(portfolio.positions).toHaveLength(1);
    const pos = portfolio.positions[0];
    expect(pos.ticker).toBe('AAPL');
    expect(pos.currentPrice).toBe(250);
    expect(pos.pnl).toBe((250 - 200) * 10);
    expect(pos.hasPrice).toBe(true);
    expect(pricesService.getPricesByTickers.mock.calls[0]).toEqual([['AAPL']]);
  });

  it('returns positions with null P&L when no price is stored', async () => {
    transactionsService.getOpenPositions.mockResolvedValue([
      { ticker: 'MSFT', quantity: 5, avgCost: 300 },
    ]);
    pricesService.getLastBatchRun.mockResolvedValue(null);
    pricesService.getPricesByTickers.mockResolvedValue(
      new Map([['MSFT', null]]),
    );

    const portfolio = await service.getPortfolio(USER_ID);

    const pos = portfolio.positions[0];
    expect(pos.currentPrice).toBeNull();
    expect(pos.pnl).toBeNull();
    expect(pos.hasPrice).toBe(false);
    expect(portfolio.lastPriceUpdate).toBeNull();
  });

  it('sums totalValue from all positions with prices', async () => {
    transactionsService.getOpenPositions.mockResolvedValue([
      { ticker: 'AAPL', quantity: 10, avgCost: 200 },
      { ticker: 'MSFT', quantity: 5, avgCost: 300 },
    ]);
    pricesService.getLastBatchRun.mockResolvedValue(null);
    pricesService.getPricesByTickers.mockResolvedValue(
      new Map([
        ['AAPL', 250],
        ['MSFT', 400],
      ]),
    );

    const portfolio = await service.getPortfolio(USER_ID);

    expect(portfolio.totalValue).toBe(10 * 250 + 5 * 400);
  });
});
