import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateColorCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  hexCode?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
