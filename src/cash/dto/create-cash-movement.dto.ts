import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  CashMethod,
  CashMovementSource,
  CashMovementType,
} from '../entities/cash-movement.entity';

export class CreateCashMovementDto {
  @IsEnum(CashMovementType)
  type: CashMovementType;

  @IsEnum(CashMovementSource)
  source: CashMovementSource;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceId?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsEnum(CashMethod)
  method?: CashMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  occurredAt?: string;
}
