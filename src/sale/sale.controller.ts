// src/sale/sale.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ApiTags } from '@nestjs/swagger';
import { WhatsAppService } from './awarness.sales';
import { SaleStatus } from './entities/sale.entity';

@ApiTags('sales')
@Controller('sales')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.saleService.create(dto);
  }

  @Get('top-products')
  findTopProducts() {
    return this.saleService.topProductsBySales(10);
  }

  @Get('recent-sales')
  findRecentSales() {
    return this.saleService.fetchRecentSales(10);
  }

  @Get('total-sales')
  findTotalSales() {
    return this.saleService.totalSales();
  }

  @Get('total-sales-count')
  findTotalSalesCount() {
    return this.saleService.totalSaleCount();
  }
  @Post('sales-metrics')
  findSalesMetrics(@Body() dto: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
    return this.saleService.getSaleMetrics(dto.days);
  }

  @Post('sales-by-days')
  findSalesByDays(@Body() dto: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
    return this.saleService.getSalesWithinNumberOfDays(dto.days);
  }

  @Post('send-whats-app-ads')
  sendWhatsAppAds() {
    return this.whatsAppService.sendMarketMessageViaWhatsApp();
  }

  @Get('total-sales-by-week')
  findTotalSalesByWeek() {
    return this.saleService.weeklySalesTrends();
  }

  @Get('filter-by-dates')
  findSalesByDateRange(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.saleService.findSalesByDateRange(startDate, endDate);
  }

  @Get()
  findAll() {
    return this.saleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleService.findOne(id);
  }

  /**
   * Update sale status and send WhatsApp notification
   * Used for manual/phone orders to notify customers
   *
   * Example request body:
   * { "status": "confirmed" } or { "status": "ready" } or { "status": "delivered" }
   */
  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: SaleStatus },
  ) {
    return this.saleService.updateSaleStatus(id, body.status);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSaleDto) {
    return this.saleService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.saleService.remove(id);
  }
}
