import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  public productId: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  public quantity: number;
}
