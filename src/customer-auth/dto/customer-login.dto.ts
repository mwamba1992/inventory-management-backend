import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerLoginDto {
  @ApiProperty({ description: 'Customer phone number', example: '+255712345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Customer password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
