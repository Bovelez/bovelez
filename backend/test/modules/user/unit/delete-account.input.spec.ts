import { validate } from 'class-validator';
import { DeleteAccountInput } from '../../../../src/modules/users/input/delete-account.input';

describe('DeleteAccountInput', () => {
  it('accepts a non-empty string password', async () => {
    const input = new DeleteAccountInput();
    input.password = 'Password1!';

    const errors = await validate(input);

    expect(errors).toHaveLength(0);
  });

  it('rejects a missing password', async () => {
    const input = new DeleteAccountInput();

    const errors = await validate(input);

    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('rejects a non-string password', async () => {
    const input = new DeleteAccountInput();
    input.password = 123456 as unknown as string;

    const errors = await validate(input);

    expect(errors[0].constraints).toHaveProperty('isString');
  });
});
