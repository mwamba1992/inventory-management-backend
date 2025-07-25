// src/sale/dto/create-sale.dto.ts
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty()
  @IsNotEmpty()
  itemId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amountPaid: number;

  @ApiProperty()
  @IsOptional()
  remarks?: string;

  @ApiProperty()
  warehouseId?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity?: number;
}
