import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';
import { Business } from '../../business/entities/business.entity';

@Entity()
export class Tax extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    comment: 'Tax rate as a percentage (e.g. 7.25)',
  })
  rate: number;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
