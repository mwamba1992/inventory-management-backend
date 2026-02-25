import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity,
  Index,
} from 'typeorm';
import { Common } from '../../../settings/common/entities/common.entity';
import { Business } from '../../../settings/business/entities/business.entity';

@Entity({ name: 'accounts' })
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @ManyToOne(() => Common, (common) => common.id)
  code: Common | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => Common, (common) => common.id)
  type: Common | null;

  @ManyToOne(() => Account, (account) => account.childAccounts, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_account_id' })
  parentAccount: Account | null;

  @OneToMany(() => Account, (account) => account.parentAccount)
  childAccounts: Account[];
}
