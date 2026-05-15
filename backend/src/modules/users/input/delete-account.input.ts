import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountInput {
  @IsString()
  @IsNotEmpty()
  password!: string;
}
