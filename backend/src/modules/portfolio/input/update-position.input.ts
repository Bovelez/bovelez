import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  Min,
  Validate,
} from 'class-validator';
import { NotInFutureConstraint } from './create-position.input';

export class UpdatePositionInput {
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'quantity must be greater than 0' })
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0000001, { message: 'buyPrice must be greater than 0' })
  buyPrice?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Validate(NotInFutureConstraint)
  buyDate?: Date;
}
