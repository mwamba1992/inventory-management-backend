import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

export enum OtpPurpose {
  SET_PASSWORD = 'set_password',
}

/**
 * A one-time code sent to a phone number to prove the caller controls it.
 *
 * Deliberately not a BaseEntity: this is short-lived proof, not a business
 * record, and it should never be soft-deleted or audited like one.
 *
 * The code itself is never stored — only a bcrypt hash — so a leaked database
 * dump does not hand over live codes.
 */
@Entity('phone_otp')
@Index(['phone', 'purpose', 'consumedAt'])
export class PhoneOtp {
  @PrimaryGeneratedColumn()
  id: number;

  /** Stored exactly as the caller supplied it, to match how customers are looked up. */
  @Column()
  phone: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
    default: OtpPurpose.SET_PASSWORD,
  })
  purpose: OtpPurpose;

  @Column()
  codeHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  /** Incremented on every wrong guess so a code cannot be brute-forced. */
  @Column({ default: 0 })
  attempts: number;

  /** Set when the code is used, or when superseded by a newer request. */
  @Column({ type: 'timestamp', nullable: true })
  consumedAt: Date | null;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @CreateDateColumn()
  createdAt: Date;
}
