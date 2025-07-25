import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    console.log(createRoleDto);
    const role = new Role();
    role.name = createRoleDto.name;
    role.desc = createRoleDto.desc;

    const permissions: Permission[] = [];
    for (const permissionId of createRoleDto.permissions) {
      const permission = await this.permissionRepository.findOne({
        where: { id: permissionId },
      });
      if (permission instanceof Permission) {
        permissions.push(permission);
      }
    }
    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  // Get all roles with their permissions
  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Find a role by ID
  async findOne(id: number): Promise<any> {
    return this.roleRepository.findOne({
      where: { id }, // The condition to find the role by ID
      relations: ['permissions'], // Eager load the associated permissions
    });
  }

  // Update role permissions
  async update(id: number, updateRoleDto: CreateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id }, // The condition to find the role by ID
      relations: ['permissions'], // Eager load the associated permissions
    });
    if (!role) throw new Error('Role not found');

    role.name = updateRoleDto.name || role.name;

    const permissions: Permission[] = [];
    for (const permissionId of updateRoleDto.permissions) {
      const permission = await this.permissionRepository.findOne({
        where: { id: permissionId },
      });
      if (permission instanceof Permission) {
        permissions.push(permission);
      }
    }
    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  // Example: Add permissions to a role
  async addPermissionsToRole(
    roleId: number,
    permissionIds: number[],
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'], // Load permissions
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const permissions =
      await this.permissionRepository.findByIds(permissionIds);
    role.permissions = [...role.permissions, ...permissions];

    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });
    if (!role) throw new Error('Role not found');
    await this.roleRepository.remove(role);
  }
}
