import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from '../../settings/business/entities/business.entity';

export enum SmsStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('sms_messages')
export class SmsMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @Column({ name: 'phone_number' })
  @Index()
  phoneNumber: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'sender_id', nullable: true })
  senderId: string;

  @Column({
    type: 'enum',
    enum: SmsStatus,
    default: SmsStatus.SENT,
  })
  status: SmsStatus;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ name: 'context', nullable: true })
  context: string;

  @Column({ name: 'reference', nullable: true })
  @Index()
  reference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
