import { UserResponseDto } from '../../public/dto/user-response.dto';
export class LoginDto {
  token: string;
  user: UserResponseDto;
  constructor(token: string, user: UserResponseDto) {
    this.token = token;
    this.user = user;
  }
}
