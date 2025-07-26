import { Controller, Get, Post, Body, Put, Param, Delete, Put } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // Get all permissions
  @Get()
  async findAll(): Promise<Permission[]> {
    return this.permissionService.findAll();
  }

  // Get one permission by ID
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Permission> {
    return this.permissionService.findOne(id);
  }

  // Create a new permission
  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto): Promise<Permission> {
    return this.permissionService.create(createPermissionDto);
  }

  // Update an existing permission
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.permissionService.update(id, updatePermissionDto);
  }

  // Delete a permission
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.permissionService.remove(id);
  }
}
