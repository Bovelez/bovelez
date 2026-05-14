import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginInput {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  password: string;
}
