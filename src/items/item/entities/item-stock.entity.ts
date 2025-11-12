import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';
import { Item } from './item.entity';
import { Warehouse } from '../../../settings/warehouse/entities/warehouse.entity';
import { ItemStockDistribution } from './item-stock-distribution.entity';

@Entity()
export class ItemStock extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, (item) => item.stock)
  item: Item;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.itemStocks)
  warehouse: Warehouse;

  @Column({ default: 0 })
  quantity: number;

  @Column({ nullable: true })
  reorderPoint: number;

  @OneToMany(() => ItemStockDistribution, (distribution) => distribution.itemStock)
  distributions: ItemStockDistribution[];
}
