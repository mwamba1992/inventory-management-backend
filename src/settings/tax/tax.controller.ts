import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post()
  create(@Body() createTaxDto: CreateTaxDto) {
    return this.taxService.create(createTaxDto);
  }

  @Get()
  findAll() {
    return this.taxService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taxService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateTaxDto) {
    return this.taxService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxService.remove(+id);
  }
}
