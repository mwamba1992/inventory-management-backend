import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import {
  BusinessOverviewReport,
  CustomerReport,
  InventoryReport,
  FinancialReport,
  BalanceSheetReport,
} from './interfaces/report.interface';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get business overview report
   * GET /reports/business-overview?dateRange=last_30_days
   */
  @Get('business-overview')
  async getBusinessOverview(
    @Query() filter: ReportFilterDto,
  ): Promise<BusinessOverviewReport> {
    return this.reportsService.getBusinessOverview(filter);
  }

  /**
   * Get inventory report
   * GET /reports/inventory
   */
  @Get('inventory')
  async getInventoryReport(
    @Query() filter: ReportFilterDto,
  ): Promise<InventoryReport> {
    return this.reportsService.getInventoryReport(filter);
  }

  /**
   * Get customer report
   * GET /reports/customers?dateRange=last_30_days
   */
  @Get('customers')
  async getCustomerReport(
    @Query() filter: ReportFilterDto,
  ): Promise<CustomerReport> {
    return this.reportsService.getCustomerReport(filter);
  }

  /**
   * Get financial report
   * GET /reports/financial?dateRange=last_30_days
   */
  @Get('financial')
  async getFinancialReport(
    @Query() filter: ReportFilterDto,
  ): Promise<FinancialReport> {
    return this.reportsService.getFinancialReport(filter);
  }

  /**
   * Get balance sheet report
   * GET /reports/balance-sheet?asOfDate=2024-12-31
   */
  @Get('balance-sheet')
  async getBalanceSheet(
    @Query('asOfDate') asOfDate?: string,
  ): Promise<BalanceSheetReport> {
    const date = asOfDate ? new Date(asOfDate) : undefined;
    return this.reportsService.getBalanceSheet(date);
  }
}
