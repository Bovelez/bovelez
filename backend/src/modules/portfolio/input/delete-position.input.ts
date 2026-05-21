import { IsNumber, IsOptional, Min } from 'class-validator';

export class DeletePositionInput {
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'quantity must be greater than 0' })
  quantity?: number;
}
