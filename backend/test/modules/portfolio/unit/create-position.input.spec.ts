import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePositionInput } from '../../../../src/modules/portfolio/input/create-position.input';

describe('CreatePositionInput', () => {
  const basePayload = {
    ticker: 'AAPL',
    quantity: 10,
    buyPrice: 100,
    buyDate: '2025-01-15',
  };

  async function validatePayload(
    payload: Record<string, unknown>,
  ): Promise<string[]> {
    const instance = plainToInstance(CreatePositionInput, payload);
    const errors = await validate(instance);
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

  it('rejects buyPrice <= 0', async () => {
    const messages = await validatePayload({ ...basePayload, buyPrice: -5 });
    expect(messages.join(' ')).toMatch(/buyPrice/i);
  });

  it('rejects a future buyDate', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const messages = await validatePayload({
      ...basePayload,
      buyDate: future.toISOString(),
    });
    expect(messages.join(' ')).toMatch(/buyDate/i);
  });

  it('rejects a non-string ticker', async () => {
    const messages = await validatePayload({ ...basePayload, ticker: 123 });
    expect(messages.join(' ')).toMatch(/ticker/i);
  });
});
