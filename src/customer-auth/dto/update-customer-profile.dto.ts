import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerProfileDto {
  @ApiProperty({ description: 'Customer full name', example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Customer email', example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Customer city', example: 'Dar es Salaam', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Customer region', example: 'Kinondoni', required: false })
  @IsString()
  @IsOptional()
  region?: string;
}
