import { PartialType } from '@nestjs/mapped-types';
import { CreateColorCategoryDto } from './create-color-category.dto';

export class UpdateColorCategoryDto extends PartialType(CreateColorCategoryDto) {}
