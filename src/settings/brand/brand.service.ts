import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UserContextService } from '../../auth/user/dto/user.context';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly userContextService: UserContextService,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const businessId = this.userContextService.getBusinessId();

    // Check if brand with same name already exists within this business
    const existingBrand = await this.brandRepository.findOne({
      where: { name: createBrandDto.name, businessId },
    });

    if (existingBrand) {
      throw new ConflictException(`Brand with name "${createBrandDto.name}" already exists`);
    }

    const brand = this.brandRepository.create({
      ...createBrandDto,
      businessId,
    });
    return this.brandRepository.save(brand);
  }

  async findAll(): Promise<Brand[]> {
    return this.brandRepository.find({
      where: { businessId: this.userContextService.getBusinessId() },
      order: { name: 'ASC' },
    });
  }

  async findActive(): Promise<Brand[]> {
    return this.brandRepository.find({
      where: {
        isActive: true,
        businessId: this.userContextService.getBusinessId(),
      },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
      relations: ['items'],
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const businessId = this.userContextService.getBusinessId();
    const brand = await this.findOne(id);

    // If updating name, check if new name already exists
    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existingBrand = await this.brandRepository.findOne({
        where: { name: updateBrandDto.name, businessId },
      });

      if (existingBrand) {
        throw new ConflictException(`Brand with name "${updateBrandDto.name}" already exists`);
      }
    }

    Object.assign(brand, updateBrandDto);
    return this.brandRepository.save(brand);
  }

  async remove(id: number): Promise<void> {
    const brand = await this.findOne(id);

    // Check if brand has items associated
    if (brand.items && brand.items.length > 0) {
      throw new ConflictException(
        `Cannot delete brand "${brand.name}" because it has ${brand.items.length} item(s) associated with it`,
      );
    }

    await this.brandRepository.remove(brand);
  }

  async getTotalBrands(): Promise<number> {
    return this.brandRepository.count({
      where: { businessId: this.userContextService.getBusinessId() },
    });
  }

  async getActiveBrandsCount(): Promise<number> {
    return this.brandRepository.count({
      where: {
        isActive: true,
        businessId: this.userContextService.getBusinessId(),
      },
    });
  }
}
