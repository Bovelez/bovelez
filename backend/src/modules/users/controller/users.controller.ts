import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { AuthenticatedUser } from '../../public/decorator/authenticated-user.decorator';
import { DeleteAccountInput } from '../input/delete-account.input';
import { UsersService } from '../service/users.service';
import { AuthenticatedUserValidator } from '../validator/authenticated-user.validator';
import type { ValidatedAuthenticatedUser } from '../validator/authenticated-user.validator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Body() input: DeleteAccountInput,
  ): Promise<void> {
    await this.usersService.deleteOwnAccount(authenticatedUser, input);
  }
}
