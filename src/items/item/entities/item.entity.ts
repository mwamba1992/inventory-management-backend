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
import { ItemSupplier } from '../../../settings/item-suppliers/entities/item-supplier.entity';

@Entity()
export class Item extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  code: string;

  @Column({ nullable: true })
  desc: string;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => Common, (category) => category.items, { nullable: true })
  category: Common;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.items, { nullable: true })
  warehouse: Warehouse;

  @ManyToOne(() => ItemSupplier, { nullable: true })
  supplier: ItemSupplier;

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
