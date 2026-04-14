// src/sale/entities/sale.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../settings/customer/entities/customer.entity';
import { Item } from '../../items/item/entities/item.entity';
import { Warehouse } from '../../settings/warehouse/entities/warehouse.entity';
import { Business } from '../../settings/business/entities/business.entity';

export enum SaleStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity()
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Item, { eager: true })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Warehouse, { eager: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouseId: Warehouse;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amountPaid: number;

  @Column({ nullable: true })
  remarks: string;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.PENDING,
  })
  status: SaleStatus;

  @Column({ name: 'whatsapp_notified', default: false })
  whatsappNotified: boolean;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
