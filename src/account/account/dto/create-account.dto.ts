import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  codeId: number;

  @IsNotEmpty()
  @IsNumber()
  typeId: number;

  @IsOptional()
  @IsNumber()
  parentAccountId?: number;
}
