import { Column, Entity, OneToMany, ManyToOne, PrimaryGeneratedColumn, JoinColumn, Index } from 'typeorm';
import { Item } from '../../../items/item/entities/item.entity';
import { Business } from '../../business/entities/business.entity';

@Entity()
export class Common {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  // Self-referencing relationship for subcategories
  @ManyToOne(() => Common, (common) => common.subcategories, { nullable: true })
  parentCategory: Common;

  @OneToMany(() => Common, (common) => common.parentCategory)
  subcategories: Common[];

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];

  @OneToMany(() => Business, (business) => business.category)
  businesses: Item[];
}
