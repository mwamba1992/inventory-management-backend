import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Business } from '../../settings/business/entities/business.entity';

@Entity()
export class Expense extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @Column()
  title: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  category: string; // e.g. transport, salaries, maintenance

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column()
  createdBy: string;
}
