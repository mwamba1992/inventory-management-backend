import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  expenseDate: string;
}
