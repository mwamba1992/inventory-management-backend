import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ description: 'Brand name', example: 'Samsung' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Brand description', example: 'Samsung Electronics Co., Ltd.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Brand logo URL', example: 'https://example.com/logo.png', required: false })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ description: 'Brand website', example: 'https://www.samsung.com', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Is brand active', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
