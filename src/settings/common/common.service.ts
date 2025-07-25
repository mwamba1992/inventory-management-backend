import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';
import { Common } from './entities/common.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CommonService {
  constructor(
    @InjectRepository(Common)
    private readonly commonRepository: Repository<Common>,
  ) {}

  async create(createDto: CreateCommonDto): Promise<Common> {
    const entity = this.commonRepository.create(createDto);
    return this.commonRepository.save(entity);
  }

  findAll(): Promise<Common[]> {
    return this.commonRepository.find({ relations: ['items'] });
  }

  async findOne(id: number): Promise<Common> {
    const entity = await this.commonRepository.findOne({
      where: { id },
      relations: ['items', 'warehouses'],
    });
    if (!entity) {
      throw new NotFoundException(`Common with id ${id} not found`);
    }
    return entity;
  }

  async update(id: number, updateDto: UpdateCommonDto): Promise<Common> {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return this.commonRepository.save(entity);
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
