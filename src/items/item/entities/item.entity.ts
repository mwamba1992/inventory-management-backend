import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';
import { Common } from '../../../settings/common/entities/common.entity';
import { Business } from '../../../settings/business/entities/business.entity';
import { InventoryTransaction } from '../../../transaction/entities/transaction.entity';
import { ItemPrice } from './item-price.entity';
import { ItemStock } from './item-stock.entity';
import { ItemAccountMapping } from './item-account-mapping.entity';
import { Warehouse } from '../../../settings/warehouse/entities/warehouse.entity';

@Entity()
export class Item extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  desc: string;

  @ManyToOne(() => Common, (category) => category.items)
  category: Common;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.items)
  warehouse: Warehouse;

  @ManyToOne(() => Business, (business) => business.items)
  business: Business;

  @OneToMany(() => InventoryTransaction, (inventory) => inventory.item)
  transactions: InventoryTransaction[];

  @OneToMany(() => ItemPrice, (itemPrice) => itemPrice.item)
  prices: ItemPrice[];

  @OneToMany(() => ItemStock, (itemStock) => itemStock.item)
  stock: ItemStock[];

  @OneToMany(() => ItemAccountMapping, (mapping) => mapping.item)
  accountMappings: ItemAccountMapping[];
}
