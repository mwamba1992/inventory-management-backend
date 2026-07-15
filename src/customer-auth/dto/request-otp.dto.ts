import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ description: 'Customer phone number', example: '+255712345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  // Declared so the whitelisting ValidationPipe preserves it — the controller
  // forwards it to the service, which falls back to the request context.
  @ApiProperty({ description: 'Business ID (optional)', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  businessId?: number;
}
