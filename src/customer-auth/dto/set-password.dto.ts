import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
  @ApiProperty({ description: 'Customer phone number', example: '+255712345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  // Required. Without it this endpoint sets a password for anyone who can name
  // a phone number — and every guest checkout creates an account with no
  // password. The code is what proves the caller actually holds the phone.
  @ApiProperty({ description: '6-digit code sent by SMS', example: '482915' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  otp: string;

  // Declared so the whitelisting ValidationPipe preserves it — the controller
  // forwards it to the service, which falls back to the request context.
  @ApiProperty({ description: 'Business ID (optional)', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  businessId?: number;
}
