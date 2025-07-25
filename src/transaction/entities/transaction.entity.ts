// src/inventory/entities/transaction.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Item } from '../../items/item/entities/item.entity';
import { BaseEntity } from '../../utils/base.entity';

@Entity('inventory_transactions')
export class InventoryTransaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, (item) => item.transactions)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column()
  transactionType: string; // 'purchase', 'sale', 'return', 'adjustment'

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Accounting impact fields
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  inventoryImpact: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  revenueImpact: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cogsImpact: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;
}
