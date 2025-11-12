import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateColorCategoryDto } from './dto/create-color-category.dto';
import { UpdateColorCategoryDto } from './dto/update-color-category.dto';
import { ColorCategory } from './entities/color-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ColorCategoryService {
  constructor(
    @InjectRepository(ColorCategory)
    private readonly colorCategoryRepository: Repository<ColorCategory>,
  ) {}

  async create(createColorCategoryDto: CreateColorCategoryDto): Promise<ColorCategory> {
    // Check if color category with same name already exists
    const existingColorCategory = await this.colorCategoryRepository.findOne({
      where: { name: createColorCategoryDto.name },
    });

    if (existingColorCategory) {
      throw new ConflictException('Color category with this name already exists');
    }

    const colorCategory = this.colorCategoryRepository.create(createColorCategoryDto);
    return await this.colorCategoryRepository.save(colorCategory);
  }

  async findAll(): Promise<ColorCategory[]> {
    return await this.colorCategoryRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ColorCategory> {
    const colorCategory = await this.colorCategoryRepository.findOne({
      where: { id },
    });

    if (!colorCategory) {
      throw new NotFoundException(`Color category with ID ${id} not found`);
    }

    return colorCategory;
  }

  async update(
    id: number,
    updateColorCategoryDto: UpdateColorCategoryDto,
  ): Promise<ColorCategory> {
    const colorCategory = await this.findOne(id);

    // Check if name is being updated and if new name already exists
    if (updateColorCategoryDto.name && updateColorCategoryDto.name !== colorCategory.name) {
      const existingColorCategory = await this.colorCategoryRepository.findOne({
        where: { name: updateColorCategoryDto.name },
      });

      if (existingColorCategory) {
        throw new ConflictException('Color category with this name already exists');
      }
    }

    Object.assign(colorCategory, updateColorCategoryDto);
    return await this.colorCategoryRepository.save(colorCategory);
  }

  async remove(id: number): Promise<void> {
    const colorCategory = await this.findOne(id);
    await this.colorCategoryRepository.remove(colorCategory);
  }

  async findByName(name: string): Promise<ColorCategory | null> {
    return await this.colorCategoryRepository.findOne({
      where: { name },
    });
  }
}
