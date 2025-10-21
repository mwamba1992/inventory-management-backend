import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WhatsAppOrder } from './whatsapp-order.entity';
import { Item } from '../../items/item/entities/item.entity';

@Entity('whatsapp_order_items')
export class WhatsAppOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WhatsAppOrder, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: WhatsAppOrder;

  @ManyToOne(() => Item, { eager: true })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;
}
