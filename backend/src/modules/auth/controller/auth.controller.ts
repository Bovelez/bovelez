import {
  Controller,
  HttpCode,
  Post,
  Get,
  Body,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { Public } from '../decorators/public.decorator';
import { LoginInput } from '../input/login.input';
import { LoginDto } from '../dto/login.dto';
import { CreateUserInput } from '../input/create-user.input';
import { UserResponseDto } from '../../public/dto/user-response.dto';
import { GetUserId } from '../../public/decorator/get.user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() createUserInput: CreateUserInput,
  ): Promise<LoginDto> {
    return this.authService.register(createUserInput);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() credentials: LoginInput): Promise<LoginDto> {
    return this.authService.login(credentials);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@GetUserId() userId: string): Promise<UserResponseDto> {
    if (!userId) throw new NotFoundException('User not found');
    return this.authService.getUserById(userId);
  }
}
