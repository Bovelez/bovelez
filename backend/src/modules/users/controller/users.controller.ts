import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { DeleteAccountInput } from '../input/delete-account.input';
import { UsersService } from '../service/users.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(
    @Req() request: AuthenticatedRequest,
    @Body() input: DeleteAccountInput,
  ): Promise<void> {
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    await this.usersService.deleteOwnAccount(userId, input);
  }
}
