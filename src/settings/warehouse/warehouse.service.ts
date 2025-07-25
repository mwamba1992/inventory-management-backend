import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Warehouse } from './entities/warehouse.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    // Check if warehouse with same name already exists
    const existingWarehouse = await this.warehouseRepository.findOne({
      where: { name: createWarehouseDto.name },
    });

    if (existingWarehouse) {
      throw new ConflictException('Warehouse with this name already exists');
    }

    const warehouse = this.warehouseRepository.create(createWarehouseDto);
    return await this.warehouseRepository.save(warehouse);
  }

  async findAll(): Promise<Warehouse[]> {
    return await this.warehouseRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async update(
    id: number,
    updateWarehouseDto: UpdateWarehouseDto,
  ): Promise<Warehouse> {
    const warehouse = await this.findOne(id);

    // Check if name is being updated and if new name already exists
    if (updateWarehouseDto.name && updateWarehouseDto.name !== warehouse.name) {
      const existingWarehouse = await this.warehouseRepository.findOne({
        where: { name: updateWarehouseDto.name },
      });

      if (existingWarehouse) {
        throw new ConflictException('Warehouse with this name already exists');
      }
    }

    Object.assign(warehouse, updateWarehouseDto);
    return await this.warehouseRepository.save(warehouse);
  }

  async remove(id: number): Promise<void> {
    const warehouse = await this.findOne(id);
    await this.warehouseRepository.remove(warehouse);
  }

  async findByName(name: string): Promise<Warehouse | null> {
    return await this.warehouseRepository.findOne({
      where: { name },
    });
  }

  async findActive(): Promise<Warehouse[]> {
    return await this.warehouseRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async updateStock(id: number, currentStock: number): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    warehouse.currentStock = currentStock;
    return await this.warehouseRepository.save(warehouse);
  }
}
