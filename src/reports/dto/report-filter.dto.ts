import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum DateRange {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

export enum ReportType {
  OVERVIEW = 'overview',
  SALES = 'sales',
  INVENTORY = 'inventory',
  CUSTOMERS = 'customers',
}

export class ReportFilterDto {
  @IsOptional()
  @IsEnum(DateRange)
  dateRange?: DateRange;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @IsOptional()
  businessId?: number;
}
