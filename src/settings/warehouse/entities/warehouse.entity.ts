// src/warehouses/entities/warehouse.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Item } from '../../../items/item/entities/item.entity';
import { ItemStock } from '../../../items/item/entities/item-stock.entity';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  managerName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentStock: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  @OneToMany(() => Item, (item) => item.warehouse)
  items: Item[];

  @OneToMany(() => Item, (item) => item.stock)
  itemStocks: ItemStock[];
}
