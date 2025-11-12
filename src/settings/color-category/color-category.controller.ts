import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CreateColorCategoryDto } from './dto/create-color-category.dto';
import { ColorCategoryService } from './color-category.service';
import { UpdateColorCategoryDto } from './dto/update-color-category.dto';

@Controller('color-categories')
export class ColorCategoryController {
  constructor(private readonly colorCategoryService: ColorCategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createColorCategoryDto: CreateColorCategoryDto): Promise<any> {
    return await this.colorCategoryService.create(createColorCategoryDto);
  }

  @Get()
  async findAll(): Promise<any[]> {
    return await this.colorCategoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.colorCategoryService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateColorCategoryDto: UpdateColorCategoryDto,
  ): Promise<any> {
    return await this.colorCategoryService.update(id, updateColorCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.colorCategoryService.remove(id);
  }
}
