import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  CashMethod,
  CashMovementSource,
  CashMovementType,
} from '../entities/cash-movement.entity';

export class CashQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsEnum(CashMethod)
  method?: CashMethod;

  @IsOptional()
  @IsEnum(CashMovementType)
  type?: CashMovementType;

  @IsOptional()
  @IsEnum(CashMovementSource)
  source?: CashMovementSource;
}
