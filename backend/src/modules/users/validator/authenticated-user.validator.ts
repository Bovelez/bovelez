import {
  Injectable,
  PipeTransform,
  UnauthorizedException,
} from '@nestjs/common';

export type RequestAuthenticatedUser = {
  id?: string;
};

export type ValidatedAuthenticatedUser = {
  id: string;
};

@Injectable()
export class AuthenticatedUserValidator implements PipeTransform<
  RequestAuthenticatedUser | undefined,
  ValidatedAuthenticatedUser
> {
  transform(
    authenticatedUser: RequestAuthenticatedUser | undefined,
  ): ValidatedAuthenticatedUser {
    if (!authenticatedUser?.id) {
      throw new UnauthorizedException('Usuario autenticado inválido');
    }

    return {
      id: authenticatedUser.id,
    };
  }
}
