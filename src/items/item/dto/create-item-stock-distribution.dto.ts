import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateItemStockDistributionDto {
  @IsNotEmpty()
  @IsNumber()
  itemStockId: number;

  @IsOptional()
  @IsNumber()
  colorCategoryId?: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
