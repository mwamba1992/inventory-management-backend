import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.roleService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateRoleDto: CreateRoleDto) {
    return this.roleService.update(+id, updateRoleDto);
  }

  @Put(':id')
  addPermissionsToRole(
    @Param('id') id: number,
    @Body() permissionIds: number[],
  ) {
    return this.roleService.addPermissionsToRole(+id, permissionIds);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.roleService.remove(+id);
  }
}
