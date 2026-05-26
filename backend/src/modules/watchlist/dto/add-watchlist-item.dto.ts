import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddWatchlistItemDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  @Matches(/^[A-Z]{1,5}$/, {
    message: 'ticker must be 1–5 letters',
  })
  ticker: string;
}
