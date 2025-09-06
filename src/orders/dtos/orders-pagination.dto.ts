import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from 'generated/prisma';
import { PaginationDto } from 'src/common';

export class OrdersPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  public status?: OrderStatus;
}
