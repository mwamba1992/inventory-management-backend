import {
  BaseEntity,
  Column,
  Entity, ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from '../../../items/item/entities/item.entity';
import { Common } from '../../common/entities/common.entity';

@Entity()
export class Business extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @OneToMany(() => Item, (item) => item.business)
  items: Item[];

  @ManyToOne(() => Common, (common) => common.items)
  category: Business;
}
