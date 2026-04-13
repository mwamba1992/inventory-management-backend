import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Business } from '../../settings/business/entities/business.entity';

@Entity('meta_ad_insights')
@Unique(['campaignId', 'adId', 'date', 'businessId'])
export class MetaAdInsight {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  @Index()
  business: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId: number;

  @Column({ name: 'campaign_id' })
  campaignId: string;

  @Column({ name: 'campaign_name' })
  campaignName: string;

  @Column({ name: 'adset_id', nullable: true })
  adSetId: string;

  @Column({ name: 'adset_name', nullable: true })
  adSetName: string;

  @Column({ name: 'ad_id', nullable: true })
  adId: string;

  @Column({ name: 'ad_name', nullable: true })
  adName: string;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  spend: number;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'int', default: 0 })
  conversions: number;

  @Column({ type: 'int', default: 0 })
  reach: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  frequency: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  cpc: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  cpm: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  ctr: number;

  @Column({ type: 'text', nullable: true, name: 'ad_creative_body' })
  adCreativeBody: string;

  @Column({ type: 'jsonb', nullable: true })
  actions: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
