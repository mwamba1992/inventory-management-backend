import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateItemDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  desc: string;

  @IsNotEmpty()
  categoryId: number;

  @IsNotEmpty()
  warehouseId: number;

  @IsNotEmpty()
  businessId: number;

  @IsNotEmpty()
  purchaseAmountId: number;

  @IsNotEmpty()
  freightAmountId: number;

  @IsNumber()
  profitMargin: number;

  @IsNotEmpty()
  sellingPriceId: number;

  @IsNumber()
  stockQuantity: number;

  @IsNotEmpty()
  saleAccountId: number;

  @IsNotEmpty()
  inventoryAccountId: number;

  @IsNotEmpty()
  costOfGoodsAccountId: number;
}
