import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SellPositionInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  ticker!: string;

  @IsNumber()
  @Min(1, { message: 'quantity must be greater than 0' })
  quantity!: number;

  @Type(() => Date)
  @IsDate()
  date!: Date;
}
