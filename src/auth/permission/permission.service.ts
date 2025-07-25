import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  // Get all permissions
  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Get a single permission by ID
  async findOne(id: number): Promise<any> {
    return this.permissionRepository.findOne({
      where: { id },
    });
  }

  // Create a new permission
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  // Update an existing permission
  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);
    if (!permission) {
      throw new Error('Permission not found');
    }

    // Update the permission with new data
    Object.assign(permission, updatePermissionDto);
    return this.permissionRepository.save(permission);
  }

  // Delete a permission
  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    if (!permission) {
      throw new Error('Permission not found');
    }

    await this.permissionRepository.remove(permission);
  }
}
