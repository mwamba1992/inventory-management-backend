import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from '../../settings/customer/entities/customer.entity';
import { Warehouse } from '../../settings/warehouse/entities/warehouse.entity';
import { WhatsAppOrderItem } from './whatsapp-order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum OrderSource {
  WHATSAPP = 'whatsapp',
  ECOMMERCE = 'ecommerce',
  POS = 'pos',
  PHONE = 'phone',
}

export enum PaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('whatsapp_orders')
export class WhatsAppOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ name: 'customer_phone' })
  customerPhone: string;

  @ManyToOne(() => Customer, { eager: true, nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Warehouse, { eager: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @OneToMany(() => WhatsAppOrderItem, (item) => item.order, { cascade: true, eager: true })
  items: WhatsAppOrderItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderSource,
    default: OrderSource.WHATSAPP,
  })
  orderSource: OrderSource;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'int', nullable: true })
  rating: number | null; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @Column({ name: 'rated_at', type: 'timestamp', nullable: true })
  ratedAt: Date | null;
}
