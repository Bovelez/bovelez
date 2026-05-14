import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
export const GetUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: { id?: string } }>();
    const id = request.user?.id;
    if (!id) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return id;
  },
);
