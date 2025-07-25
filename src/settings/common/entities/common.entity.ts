import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../../../items/item/entities/item.entity';
import { Business } from '../../business/entities/business.entity';

@Entity()
export class Common {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];

  @OneToMany(() => Business, (business) => business.category)
  businesses: Item[];
}
