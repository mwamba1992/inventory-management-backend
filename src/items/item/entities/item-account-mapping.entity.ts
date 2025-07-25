import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { Item } from './item.entity';
import { Account } from '../../../account/account/entities/account.entity';

@Entity()
export class ItemAccountMapping extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, (item) => item.accountMappings)
  item: Item;

  @ManyToOne(() => Account, { nullable: false, eager: true })
  @JoinColumn({ name: 'sale_account_id' })
  saleAccount: Account;

  @ManyToOne(() => Account, { nullable: false, eager: true })
  @JoinColumn({ name: 'inventory_account_id' })
  inventoryAccount: Account;

  @ManyToOne(() => Account, { nullable: false, eager: true })
  @JoinColumn({ name: 'cogs_account_id' })
  costOfGoodsAccount: Account;
}
