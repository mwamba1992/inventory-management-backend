import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';

@Entity('color_categories')
export class ColorCategory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  hexCode: string;

  @Column({ nullable: true })
  description: string;
}
