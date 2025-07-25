import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';

@Entity()
export class Tax extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

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
