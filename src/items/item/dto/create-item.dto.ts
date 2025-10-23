import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ItemCondition } from '../entities/item.entity';

export class CreateItemDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  desc: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @IsOptional()
  categoryId: number;

  @IsOptional()
  warehouseId: number;

  @IsOptional()
  supplierId: number;

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
