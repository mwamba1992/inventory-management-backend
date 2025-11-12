import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';
import { ItemStock } from './item-stock.entity';
import { ColorCategory } from '../../../settings/color-category/entities/color-category.entity';

@Entity()
export class ItemStockDistribution extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ItemStock, (itemStock) => itemStock.distributions)
  itemStock: ItemStock;

  @ManyToOne(() => ColorCategory, { nullable: true })
  colorCategory: ColorCategory;

  @Column({ default: 0 })
  quantity: number;
}
