import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Item } from '../../item/entities/item.entity';
import { WhatsAppOrder } from '../../../whatsapp/entities/whatsapp-order.entity';

export enum ReviewStatus {
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

/**
 * A customer's rating of one product from one delivered order.
 *
 * The order is what makes a review trustworthy: a row can only exist for a
 * product the customer actually received, and only once per order.
 */
@Entity('product_review')
@Unique(['orderId', 'itemId'])
export class ProductReview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Index()
  @Column({ name: 'item_id' })
  itemId: number;

  @ManyToOne(() => WhatsAppOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: WhatsAppOrder;

  @Column({ name: 'order_id' })
  orderId: number;

  @Index()
  @Column({ name: 'business_id' })
  businessId: number;

  /** Who wrote it. Never returned by the public endpoints. */
  @Column({ name: 'customer_phone' })
  customerPhone: string;

  /** What the storefront shows, e.g. "Asha M." */
  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PUBLISHED })
  status: ReviewStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
