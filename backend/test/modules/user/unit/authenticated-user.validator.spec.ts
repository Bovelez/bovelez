import { UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUserValidator } from '../../../../src/modules/users/validator/authenticated-user.validator';

describe('AuthenticatedUserValidator', () => {
  let validator: AuthenticatedUserValidator;

  beforeEach(() => {
    validator = new AuthenticatedUserValidator();
  });

  it('returns an authenticated user with a required id', () => {
    const result = validator.transform({ id: 'user-1' });

    expect(result).toEqual({ id: 'user-1' });
  });

  it('throws UnauthorizedException when the authenticated user is missing', () => {
    expect(() => validator.transform(undefined)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the authenticated user id is missing', () => {
    expect(() => validator.transform({})).toThrow(UnauthorizedException);
  });
});
