// src/customer/customer.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UserContextService } from '../../auth/user/dto/user.context';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly userContextService: UserContextService,
  ) {}

  create(dto: CreateCustomerDto) {
    const customer = this.repo.create({
      ...dto,
      businessId: this.userContextService.getBusinessId(),
    });
    return this.repo.save(customer);
  }

  findAll() {
    return this.repo.find({
      where: { businessId: this.userContextService.getBusinessId() },
    });
  }

  async findOne(id: number) {
    const customer = await this.repo.findOneBy({
      id,
      businessId: this.userContextService.getBusinessId(),
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: number, dto: UpdateCustomerDto) {
    await this.findOne(id);
    await this.repo.update(
      { id, businessId: this.userContextService.getBusinessId() },
      dto,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete({
      id,
      businessId: this.userContextService.getBusinessId(),
    });
  }

  async totalCustomers(): Promise<number> {
    return await this.repo.count({
      where: { businessId: this.userContextService.getBusinessId() },
    });
  }
}
