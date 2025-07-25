import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';
import { Item } from './item.entity';

@Entity()
export class ItemPrice extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, (item) => item.prices)
  item: Item;

  @Column()
  purchaseAmount: number;

  @Column()
  freightAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  profitMargin: number;

  @Column()
  sellingPrice: number;

  @Column({ default: true })
  isActive: boolean;
}
