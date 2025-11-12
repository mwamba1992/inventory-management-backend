import { Module } from '@nestjs/common';
import { ColorCategoryService } from './color-category.service';
import { ColorCategoryController } from './color-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorCategory } from './entities/color-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ColorCategory])],
  controllers: [ColorCategoryController],
  providers: [ColorCategoryService],
  exports: [ColorCategoryService, TypeOrmModule],
})
export class ColorCategoryModule {}
