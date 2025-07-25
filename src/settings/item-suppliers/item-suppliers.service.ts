import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemSupplier } from './entities/item-supplier.entity';
import { CreateItemSupplierDto } from './dto/create-item-supplier.dto';
import { UpdateItemSupplierDto } from './dto/update-item-supplier.dto';

@Injectable()
export class ItemSuppliersService {
  constructor(
    @InjectRepository(ItemSupplier)
    private readonly repo: Repository<ItemSupplier>,
  ) {}

  create(dto: CreateItemSupplierDto) {
    const supplier = this.repo.create(dto);
    return this.repo.save(supplier);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  update(id: number, dto: UpdateItemSupplierDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
