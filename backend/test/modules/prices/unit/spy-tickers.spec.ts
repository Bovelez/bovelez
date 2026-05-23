import { SPY_TICKERS } from '../../../../src/modules/prices/seed/spy-tickers';

describe('SPY_TICKERS', () => {
  it('contains the static SPY holdings snapshot in Yahoo ticker format', () => {
    expect(SPY_TICKERS).toHaveLength(503);
    expect(new Set(SPY_TICKERS).size).toBe(SPY_TICKERS.length);
    expect(SPY_TICKERS).toContain('AAPL');
    expect(SPY_TICKERS).toContain('BRK-B');
    expect(SPY_TICKERS).toContain('MSFT');
    expect(SPY_TICKERS).not.toContain('BRK.B');
  });
});
