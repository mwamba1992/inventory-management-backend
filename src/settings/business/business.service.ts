import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  create(dto: CreateBusinessDto): Promise<Business> {
    const business = this.businessRepository.create(dto);
    return this.businessRepository.save(business);
  }

  findAll(): Promise<Business[]> {
    return this.businessRepository.find();
  }

  async findOne(id: number): Promise<Business> {
    const business = await this.businessRepository.findOneBy({ id });
    if (!business) throw new NotFoundException(`Business ${id} not found`);
    return business;
  }

  async update(id: number, dto: UpdateBusinessDto): Promise<Business> {
    await this.businessRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.businessRepository.delete(id);
  }
}
