import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';
import { Business } from '../../business/entities/business.entity';

@Entity('color_categories')
@Unique(['name', 'businessId'])
export class ColorCategory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @Column({ nullable: true })
  hexCode: string;

  @Column({ nullable: true })
  description: string;
}
