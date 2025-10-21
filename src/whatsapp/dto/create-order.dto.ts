import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  itemId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateWhatsAppOrderDto {
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsNumber()
  @IsNotEmpty()
  warehouseId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
