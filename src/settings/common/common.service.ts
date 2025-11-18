import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';
import { Common } from './entities/common.entity';
import { Repository, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CommonService {
  constructor(
    @InjectRepository(Common)
    private readonly commonRepository: Repository<Common>,
  ) {}

  async create(createDto: CreateCommonDto): Promise<Common> {
    const entity = this.commonRepository.create(createDto);

    // If parentCategoryId is provided, set the parent category
    if (createDto.parentCategoryId) {
      const parentCategory = await this.findOne(createDto.parentCategoryId);
      entity.parentCategory = parentCategory;
    }

    return this.commonRepository.save(entity);
  }

  findAll(): Promise<Common[]> {
    return this.commonRepository.find({
      relations: ['items', 'parentCategory', 'subcategories']
    });
  }

  async findOne(id: number): Promise<Common> {
    const entity = await this.commonRepository.findOne({
      where: { id },
      relations: ['items', 'warehouses', 'parentCategory', 'subcategories'],
    });
    if (!entity) {
      throw new NotFoundException(`Common with id ${id} not found`);
    }
    return entity;
  }

  async update(id: number, updateDto: UpdateCommonDto): Promise<Common> {
    const entity = await this.findOne(id);

    // If updating parentCategoryId
    if (updateDto['parentCategoryId']) {
      const parentCategory = await this.findOne(updateDto['parentCategoryId']);
      entity.parentCategory = parentCategory;
    }

    Object.assign(entity, updateDto);
    return this.commonRepository.save(entity);
  }

  // Get all subcategories for a specific category
  async getSubcategories(categoryId: number): Promise<Common[]> {
    const category = await this.findOne(categoryId);
    return this.commonRepository.find({
      where: { parentCategory: { id: categoryId } },
      relations: ['parentCategory'],
    });
  }

  // Get only root categories (no parent)
  async getRootCategories(): Promise<Common[]> {
    return this.commonRepository.find({
      where: { parentCategory: IsNull() },
      relations: ['subcategories'],
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.commonRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Common with id ${id} not found`);
    }
  }

  async getByType(type: string): Promise<Common[]> {
    const entity = await this.commonRepository.find({
      where: { type: type },
    });
    if (!entity) {
      throw new NotFoundException(`Common with type ${type} not found`);
    }
    return entity;
  }
}
