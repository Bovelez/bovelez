import { IsArray, ArrayMinSize, IsString, IsNotEmpty } from 'class-validator';

export class CompareMetricsDto {
  @IsArray()
  @ArrayMinSize(2, {
    message: 'At least two tickers are required for comparison',
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tickers: string[];
}
