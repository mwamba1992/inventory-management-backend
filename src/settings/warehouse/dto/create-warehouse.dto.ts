import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  managerName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  capacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentStock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
