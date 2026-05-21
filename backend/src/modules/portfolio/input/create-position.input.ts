import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'NotInFuture', async: false })
export class NotInFutureConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!(value instanceof Date) || isNaN(value.getTime())) return false;
    return value.getTime() <= Date.now();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must not be in the future`;
  }
}

export class CreatePositionInput {
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

  @IsNumber()
  @Min(0.0000001, { message: 'buyPrice must be greater than 0' })
  buyPrice!: number;

  @Type(() => Date)
  @IsDate()
  @Validate(NotInFutureConstraint)
  buyDate!: Date;
}
