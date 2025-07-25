// src/sale/sale.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('sales')
@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

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

  @Get('total-sales-by-week')
  findTotalSalesByWeek() {
    return this.saleService.weeklySalesTrends();
  }

  @Get()
  findAll() {
    return this.saleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSaleDto) {
    return this.saleService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.saleService.remove(id);
  }
}
