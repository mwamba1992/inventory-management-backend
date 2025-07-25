import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  Patch,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { CreateItemPriceDto } from './dto/create-item-price.dto';
import { UpdateItemPriceDto } from './dto/update-item-price.dto';
import { ItemPrice } from './entities/item-price.entity';
import { CreateItemStockDto } from './dto/create-item-stock.dto';
import { UpdateItemStockDto } from './dto/update-item-stock.dto';
import { ItemStock } from './entities/item-stock.entity';
import { CreateItemAccountMappingDto } from './dto/create-item-account-mapping.dto';
import { UpdateItemAccountMappingDto } from './dto/update-item-account-mapping.dto';
import { ItemAccountMapping } from './entities/item-account-mapping.entity';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  // ========== ITEM CRUD ==========
  @Post()
  create(@Body() createItemDto: CreateItemDto): Promise<Item> {
    return this.itemService.create(createItemDto);
  }

  @Get()
  findAll(): Promise<Item[]> {
    return this.itemService.findAll();
  }

  // ========== ITEM STOCK CRUD ==========
  @Post('item-stocks')
  async createItemStock(
    @Body() createItemStockDto: CreateItemStockDto,
  ): Promise<ItemStock> {
    return this.itemService.createItemStock(createItemStockDto);
  }

  @Get('item-stocks')
  async findAllItemStocks(): Promise<ItemStock[]> {
    return this.itemService.findAllItemStocks();
  }

  @Get('item-stocks/available')
  async findAvailableItemStocks(): Promise<number> {
    return this.itemService.getTotalNumberOfItemsInStock();
  }

  @Get('item-stocks/low-stock')
  async findLowStockItemStocks(): Promise<number> {
    return this.itemService.itemsWithLowStocksCount();
  }

  @Get('item-stocks/actual-value')
  async findTotalItemStocks(): Promise<number> {
    return this.itemService.getItemsStockValue();
  }

  @Get('item-stocks/:id')
  async findOneItemStock(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemStock> {
    return this.itemService.findOneItemStock(id);
  }

  @Patch('item-stocks/:id')
  async updateItemStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemStockDto: UpdateItemStockDto,
  ): Promise<ItemStock> {
    return this.itemService.updateItemStock(id, updateItemStockDto);
  }

  @Delete('item-stocks/:id')
  async removeItemStock(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.itemService.removeItemStock(id);
  }

  // ========== ITEM ACCOUNT MAPPING CRUD ==========
  @Post('account-mappings')
  async createItemAccountMapping(
    @Body() createItemAccountMappingDto: CreateItemAccountMappingDto,
  ): Promise<ItemAccountMapping> {
    return this.itemService.createItemAccountMapping(
      createItemAccountMappingDto,
    );
  }

  @Get('account-mappings')
  async findAllItemAccountMappings(): Promise<ItemAccountMapping[]> {
    return this.itemService.findAllItemAccountMappings();
  }

  @Get('account-mappings/:id')
  async findOneItemAccountMapping(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemAccountMapping> {
    return this.itemService.findOneItemAccountMapping(id);
  }

  @Patch('account-mappings/:id')
  async updateItemAccountMapping(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemAccountMappingDto: UpdateItemAccountMappingDto,
  ): Promise<ItemAccountMapping> {
    return this.itemService.updateItemAccountMapping(
      id,
      updateItemAccountMappingDto,
    );
  }

  @Delete('account-mappings/:id')
  async removeItemAccountMapping(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.itemService.removeItemAccountMapping(id);
  }

  // ========== ITEM PRICE CRUD ==========
  @Post('item-prices')
  async createItemPrice(
    @Body() createItemPriceDto: CreateItemPriceDto,
  ): Promise<ItemPrice> {
    return this.itemService.createItemPrice(createItemPriceDto);
  }

  @Get('item-prices')
  async findAllItemPrices(): Promise<ItemPrice[]> {
    return this.itemService.findAllItemPrices();
  }

  @Get('item-prices/:id')
  async findOneItemPrice(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemPrice> {
    return this.itemService.findOneItemPrice(id);
  }

  @Patch('item-prices/:id')
  async updateItemPrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemPriceDto: UpdateItemPriceDto,
  ): Promise<ItemPrice> {
    return this.itemService.updateItemPrice(id, updateItemPriceDto);
  }

  @Delete('item-prices/:id')
  async removeItemPrice(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.itemService.removeItemPrice(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Item> {
    return this.itemService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<Item> {
    return this.itemService.update(id, updateItemDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.itemService.remove(id);
  }
}
