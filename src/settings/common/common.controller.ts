import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { CommonService } from './common.service';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post()
  create(@Body() createDto: CreateCommonDto) {
    return this.commonService.create(createDto);
  }

  @Get()
  findAll() {
    return this.commonService.findAll();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateCommonDto) {
    return this.commonService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commonService.remove(+id);
  }
  @Get('type/:type')
  getByType(@Param('type') type: string) {
    return this.commonService.getByType(type);
  }

  @Get('root-categories')
  getRootCategories() {
    return this.commonService.getRootCategories();
  }

  @Get(':id/subcategories')
  getSubcategories(@Param('id') id: string) {
    return this.commonService.getSubcategories(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commonService.findOne(+id);
  }
}
