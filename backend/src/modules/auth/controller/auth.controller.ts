import { Controller, HttpCode, Post, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { Public } from '../decorators/public.decorator';
import { LoginInput } from '../input/login.input';
import { LoginDto } from '../dto/login.dto';
import { CreateUserInput } from '../input/create-user.input';

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
}
