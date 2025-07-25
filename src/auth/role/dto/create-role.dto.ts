import { IsArray, IsString } from 'class-validator';
import { Permission } from '../../permission/entities/permission.entity';


export class CreateRoleDto {
  @IsString()
  name: string;

  @IsString()
  desc: string

  @IsArray()
  permissions: number[];
}
