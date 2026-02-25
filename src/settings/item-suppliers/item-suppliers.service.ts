import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemSupplier } from './entities/item-supplier.entity';
import { CreateItemSupplierDto } from './dto/create-item-supplier.dto';
import { UpdateItemSupplierDto } from './dto/update-item-supplier.dto';
import { UserContextService } from '../../auth/user/dto/user.context';

@Injectable()
export class ItemSuppliersService {
  constructor(
    @InjectRepository(ItemSupplier)
    private readonly repo: Repository<ItemSupplier>,
    private readonly userContextService: UserContextService,
  ) {}

  create(dto: CreateItemSupplierDto) {
    const supplier = this.repo.create({
      ...dto,
      businessId: this.userContextService.getBusinessId(),
    });
    return this.repo.save(supplier);
  }

  findAll() {
    return this.repo.find({
      where: { businessId: this.userContextService.getBusinessId() },
    });
  }

  async findOne(id: number) {
    const supplier = await this.repo.findOneBy({
      id,
      businessId: this.userContextService.getBusinessId(),
    });
    if (!supplier) {
      throw new NotFoundException(`Item supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async update(id: number, dto: UpdateItemSupplierDto) {
    await this.findOne(id);
    return this.repo.update(
      { id, businessId: this.userContextService.getBusinessId() },
      dto,
    );
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.repo.delete({
      id,
      businessId: this.userContextService.getBusinessId(),
    });
  }
}
