import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaxDto } from './dto/create-tax.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tax } from './entities/tax.entity';
import { Repository } from 'typeorm';
import { UserContextService } from '../../auth/user/dto/user.context';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    private readonly userContextService: UserContextService,
  ) {}

  async create(createTaxDto: CreateTaxDto): Promise<Tax> {
    const tax = this.taxRepository.create({
      ...createTaxDto,
      businessId: this.userContextService.getBusinessId(),
    });
    return this.taxRepository.save(tax);
  }

  findAll(): Promise<Tax[]> {
    return this.taxRepository.find({
      where: { businessId: this.userContextService.getBusinessId() },
    });
  }

  async findOne(id: number): Promise<Tax> {
    const tax = await this.taxRepository.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
    });
    if (!tax) throw new NotFoundException(`Tax with ID ${id} not found`);
    return tax;
  }

  async update(id: number, dto: CreateTaxDto): Promise<Tax> {
    const tax = await this.findOne(id);
    Object.assign(tax, dto);
    return this.taxRepository.save(tax);
  }

  async remove(id: number): Promise<void> {
    const tax = await this.findOne(id);
    await this.taxRepository.remove(tax);
  }
}
