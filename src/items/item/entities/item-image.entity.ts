import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from './item.entity';

/**
 * An additional photograph of a product.
 *
 * `Item.imageUrl` stays the main photo — every existing reader of that column
 * keeps working — and these rows are the rest of the gallery, in `position`
 * order. A product with one photo has no rows here.
 */
@Entity('item_image')
export class ItemImage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, (item) => item.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Index()
  @Column({ name: 'item_id' })
  itemId: number;

  @Column()
  url: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
