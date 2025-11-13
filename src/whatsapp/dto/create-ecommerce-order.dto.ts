import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min, IsEmail, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/whatsapp-order.entity';

export class EcommerceOrderItemDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  itemId: number;

  @ApiProperty({ description: 'Quantity', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price at time of order', example: 350400 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateEcommerceOrderDto {
  // Customer Information
  @ApiProperty({ description: 'Customer full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: 'Customer phone number', example: '255712345678' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ description: 'Customer email (optional)', example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ description: 'Customer city', example: 'Dar es Salaam', required: false })
  @IsString()
  @IsOptional()
  customerCity?: string;

  @ApiProperty({ description: 'Customer region', example: 'Kinondoni', required: false })
  @IsString()
  @IsOptional()
  customerRegion?: string;

  // Order Information
  @ApiProperty({ description: 'Warehouse ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  warehouseId: number;

  @ApiProperty({ description: 'Order items', type: [EcommerceOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EcommerceOrderItemDto)
  items: EcommerceOrderItemDto[];

  @ApiProperty({ description: 'Delivery address', example: 'House 123, Street ABC, Kinondoni' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ description: 'Order notes (optional)', example: 'Please call before delivery', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  // Payment Information
  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.MOBILE_MONEY,
    required: false
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}
