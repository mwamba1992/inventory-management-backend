import { IsString, IsNotEmpty, MinLength, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerRegisterDto {
  @ApiProperty({ description: 'Customer full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Customer phone number (unique)', example: '+255712345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Customer password (min 6 characters)', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ description: 'Customer email (optional)', example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Customer city (optional)', example: 'Dar es Salaam', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Customer region (optional)', example: 'Kinondoni', required: false })
  @IsString()
  @IsOptional()
  region?: string;
}
