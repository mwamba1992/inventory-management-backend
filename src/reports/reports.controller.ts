import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CatalogueService } from './catalogue/catalogue.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { CatalogueFilterDto } from './dto/catalogue-filter.dto';
import {
  BusinessOverviewReport,
  CustomerReport,
  InventoryReport,
  FinancialReport,
  BalanceSheetReport,
} from './interfaces/report.interface';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly catalogueService: CatalogueService,
  ) {}

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

  /**
   * Download product catalogue as PDF
   * GET /reports/catalogue/pdf?categoryId=1&inStockOnly=true
   */
  @Get('catalogue/pdf')
  async getCataloguePdf(
    @Query() filter: CatalogueFilterDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.catalogueService.generateCataloguePdf(filter);
    const filename = `catalogue-${new Date().toISOString().split('T')[0]}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
