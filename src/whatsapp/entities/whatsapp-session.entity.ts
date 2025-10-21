import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SessionState {
  MAIN_MENU = 'main_menu',
  BROWSING_CATEGORIES = 'browsing_categories',
  VIEWING_ITEMS = 'viewing_items',
  SEARCHING = 'searching',
  SEARCHING_BY_CODE = 'searching_by_code',
  ADDING_TO_CART = 'adding_to_cart',
  CART_REVIEW = 'cart_review',
  ENTERING_ADDRESS = 'entering_address',
  CONFIRMING_ORDER = 'confirming_order',
  TRACKING_ORDER = 'tracking_order',
}

@Entity('whatsapp_sessions')
export class WhatsAppSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'phone_number', unique: true })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: SessionState,
    default: SessionState.MAIN_MENU,
  })
  state: SessionState;

  @Column({ type: 'json', nullable: true })
  context: any; // Stores cart, selected category, search query, etc.

  @Column({ name: 'last_message_id', nullable: true })
  lastMessageId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
