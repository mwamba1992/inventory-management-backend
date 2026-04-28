import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CashMethod } from '../entities/cash-movement.entity';

export class RecordPurchaseDto {
  @Type(() => Number)
  @IsInt()
  itemId: number;

  @Type(() => Number)
  @IsInt()
  warehouseId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  totalCost: number;

  @IsEnum(CashMethod)
  method: CashMethod;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  orderDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
