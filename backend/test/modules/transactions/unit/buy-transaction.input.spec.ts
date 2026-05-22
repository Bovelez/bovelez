import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BuyTransactionInput } from '../../../../src/modules/transactions/input/buy-transaction.input';

describe('BuyTransactionInput', () => {
  const basePayload = {
    ticker: 'AAPL',
    quantity: 10,
    date: '2025-01-15',
  };

  async function validatePayload(
    payload: Record<string, unknown>,
  ): Promise<string[]> {
    const instance = plainToInstance(BuyTransactionInput, payload);
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
});
