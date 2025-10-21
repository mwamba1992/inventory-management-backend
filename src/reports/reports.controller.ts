import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
  BusinessOverviewReport,
  CustomerReport,
  InventoryReport,
} from './interfaces/report.interface';

@Controller('reports')
@UseGuards(AuthGuard)
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
}
