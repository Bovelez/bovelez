import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestAuthenticatedUser } from '../../users/validator/authenticated-user.validator';

type AuthenticatedRequest = Request & {
  user?: RequestAuthenticatedUser;
};

export const AuthenticatedUser = createParamDecorator(
  (
    _data: unknown,
    ctx: ExecutionContext,
  ): RequestAuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
