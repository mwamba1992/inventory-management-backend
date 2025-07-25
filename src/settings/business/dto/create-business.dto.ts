import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';
import { Business } from '../entities/business.entity';

export class CreateBusinessDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  category: Business;
}
