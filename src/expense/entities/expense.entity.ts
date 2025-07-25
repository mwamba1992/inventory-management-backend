import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Expense extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

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
