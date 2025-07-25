import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';
import { Role } from '../../role/entities/role.entity';

@Entity()
export class Permission extends BaseEntity{

  @Column()
  name:string

  @Column()
  desc: string

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

}
