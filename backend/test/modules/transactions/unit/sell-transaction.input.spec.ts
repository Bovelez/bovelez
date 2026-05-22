import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SellTransactionInput } from '../../../../src/modules/transactions/input/sell-transaction.input';

describe('SellTransactionInput', () => {
  const basePayload = {
    ticker: 'AAPL',
    quantity: 5,
    date: '2025-01-15',
  };

  async function validatePayload(
    payload: Record<string, unknown>,
  ): Promise<string[]> {
    const instance = plainToInstance(SellTransactionInput, payload);
    const errors = await validate(instance as object);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  it('accepts a valid payload', async () => {
    const messages = await validatePayload(basePayload);
    expect(messages).toEqual([]);
  });

  it('rejects an empty ticker', async () => {
    const messages = await validatePayload({ ...basePayload, ticker: '' });
    expect(messages.join(' ')).toContain('ticker');
  });

  it('rejects quantity <= 0', async () => {
    const messages = await validatePayload({ ...basePayload, quantity: 0 });
    expect(messages.join(' ')).toMatch(/quantity/i);
  });

  it('rejects a non-string ticker', async () => {
    const messages = await validatePayload({ ...basePayload, ticker: 123 });
    expect(messages.join(' ')).toMatch(/ticker/i);
  });

  it('uppercases the ticker', () => {
    const instance = plainToInstance(SellTransactionInput, {
      ...basePayload,
      ticker: 'aapl',
    });
    expect(instance.ticker).toBe('AAPL');
  });
});
