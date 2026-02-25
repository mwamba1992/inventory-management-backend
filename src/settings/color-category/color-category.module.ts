import { Module } from '@nestjs/common';
import { ColorCategoryService } from './color-category.service';
import { ColorCategoryController } from './color-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorCategory } from './entities/color-category.entity';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([ColorCategory]), SharedModule],
  controllers: [ColorCategoryController],
  providers: [ColorCategoryService],
  exports: [ColorCategoryService, TypeOrmModule],
})
export class ColorCategoryModule {}
