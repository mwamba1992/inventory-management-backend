import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../utils/base.entity';
import { Business } from '../../settings/business/entities/business.entity';

export enum CashMovementType {
  IN = 'in',
  OUT = 'out',
}

export enum CashMovementSource {
  SALE = 'sale',
  EXPENSE = 'expense',
  PURCHASE = 'purchase',
  OWNER_DRAW = 'owner_draw',
  OWNER_CONTRIBUTION = 'owner_contribution',
  TRANSFER = 'transfer',
  OPENING_BALANCE = 'opening_balance',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
}

export enum CashMethod {
  CASH = 'cash',
  MPESA = 'mpesa',
  TIGO_PESA = 'tigo_pesa',
  AIRTEL_MONEY = 'airtel_money',
  BANK = 'bank',
}

@Entity({ name: 'cash_movement' })
@Index(['businessId', 'occurredAt'])
export class CashMovement extends BaseEntity {
  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @Column({ type: 'enum', enum: CashMovementType })
  type: CashMovementType;

  @Column({ type: 'enum', enum: CashMovementSource })
  source: CashMovementSource;

  @Column({ name: 'source_id', type: 'int', nullable: true })
  sourceId: number | null;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: CashMethod, default: CashMethod.CASH })
  method: CashMethod;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;
}
