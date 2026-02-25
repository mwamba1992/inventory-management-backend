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
import { UserContextService } from '../../auth/user/dto/user.context';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly userContextService: UserContextService,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    const businessId = this.userContextService.getBusinessId();

    // Check if warehouse with same name already exists within this business
    const existingWarehouse = await this.warehouseRepository.findOne({
      where: { name: createWarehouseDto.name, businessId },
    });

    if (existingWarehouse) {
      throw new ConflictException('Warehouse with this name already exists');
    }

    const warehouse = this.warehouseRepository.create({
      ...createWarehouseDto,
      businessId,
    });
    return await this.warehouseRepository.save(warehouse);
  }

  async findAll(): Promise<Warehouse[]> {
    return await this.warehouseRepository.find({
      where: { businessId: this.userContextService.getBusinessId() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
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
    const businessId = this.userContextService.getBusinessId();
    const warehouse = await this.findOne(id);

    // Check if name is being updated and if new name already exists
    if (updateWarehouseDto.name && updateWarehouseDto.name !== warehouse.name) {
      const existingWarehouse = await this.warehouseRepository.findOne({
        where: { name: updateWarehouseDto.name, businessId },
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
      where: { name, businessId: this.userContextService.getBusinessId() },
    });
  }

  async findActive(): Promise<Warehouse[]> {
    return await this.warehouseRepository.find({
      where: {
        isActive: true,
        businessId: this.userContextService.getBusinessId(),
      },
      order: { name: 'ASC' },
    });
  }

  async updateStock(id: number, currentStock: number): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    warehouse.currentStock = currentStock;
    return await this.warehouseRepository.save(warehouse);
  }
}
