import { Type } from "class-transformer";
import { IsNumber, IsOptional, Min } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  public page: number = 1;

  @IsOptional()
  @Type(() => Number)
  public limit: number = 10;
}
