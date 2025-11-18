import { IsNotEmpty, IsString, Length, IsOptional, IsNumber } from 'class-validator';

export class CreateCommonDto {

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  readonly code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  readonly description: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  readonly type: string;

  @IsOptional()
  @IsNumber()
  readonly parentCategoryId?: number;
}
