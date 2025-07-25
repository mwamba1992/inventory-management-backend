import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Permission } from '../../permission/entities/permission.entity';
import { BaseEntity } from '../../../utils/base.entity';


@Entity()
export class Role extends BaseEntity{

  @Column()
  name: string;

  @Column()
  desc: string

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions: Permission[];
}
