import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { CreateOrderItemDto } from "./create-order-item.dto";
import { OrderStatus } from "./order-status.enum";

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  public items: CreateOrderItemDto[];
}
