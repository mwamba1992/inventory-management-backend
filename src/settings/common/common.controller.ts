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
import { Public } from '../../utils/decorators';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post()
  create(@Body() createDto: CreateCommonDto) {
    return this.commonService.create(createDto);
  }

  @Public()
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

  @Public()
  @Get('type/:type')
  getByType(@Param('type') type: string) {
    return this.commonService.getByType(type);
  }

  @Public()
  @Get('root-categories')
  getRootCategories() {
    return this.commonService.getRootCategories();
  }

  @Public()
  @Get(':id/subcategories')
  getSubcategories(@Param('id') id: string) {
    return this.commonService.getSubcategories(+id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commonService.findOne(+id);
  }
}
