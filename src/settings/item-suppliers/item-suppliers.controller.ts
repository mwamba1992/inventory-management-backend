import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ItemSuppliersService } from './item-suppliers.service';
import { CreateItemSupplierDto } from './dto/create-item-supplier.dto';
import { UpdateItemSupplierDto } from './dto/update-item-supplier.dto';

@Controller('item-suppliers')
export class ItemSuppliersController {
  constructor(private readonly service: ItemSuppliersService) {}

  @Post()
  create(@Body() dto: CreateItemSupplierDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateItemSupplierDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
