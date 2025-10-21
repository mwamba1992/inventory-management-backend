import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppSession, SessionState } from '../entities/whatsapp-session.entity';
import { SessionContext, CartItem } from '../interfaces/message.interface';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(WhatsAppSession)
    private readonly sessionRepository: Repository<WhatsAppSession>,
  ) {}

  async getOrCreateSession(phoneNumber: string): Promise<WhatsAppSession> {
    let session = await this.sessionRepository.findOne({
      where: { phoneNumber },
    });

    if (!session) {
      session = this.sessionRepository.create({
        phoneNumber,
        state: SessionState.MAIN_MENU,
        context: { cart: [] },
      });
      await this.sessionRepository.save(session);
      this.logger.log(`Created new session for ${phoneNumber}`);
    }

    return session;
  }

  async updateSessionState(
    phoneNumber: string,
    state: SessionState,
    context?: Partial<SessionContext>,
  ): Promise<WhatsAppSession> {
    const session = await this.getOrCreateSession(phoneNumber);
    session.state = state;

    if (context) {
      session.context = {
        ...session.context,
        ...context,
      };
    }

    return this.sessionRepository.save(session);
  }

  async updateContext(
    phoneNumber: string,
    context: Partial<SessionContext>,
  ): Promise<WhatsAppSession> {
    const session = await this.getOrCreateSession(phoneNumber);
    session.context = {
      ...session.context,
      ...context,
    };
    return this.sessionRepository.save(session);
  }

  async addToCart(
    phoneNumber: string,
    item: CartItem,
  ): Promise<WhatsAppSession> {
    const session = await this.getOrCreateSession(phoneNumber);
    const cart: CartItem[] = session.context?.cart || [];

    // Check if item already in cart
    const existingIndex = cart.findIndex((i) => i.itemId === item.itemId);
    if (existingIndex >= 0) {
      // Update quantity
      cart[existingIndex].quantity += item.quantity;
      cart[existingIndex].totalPrice = cart[existingIndex].quantity * cart[existingIndex].unitPrice;
    } else {
      // Add new item
      cart.push(item);
    }

    session.context = {
      ...session.context,
      cart,
    };

    return this.sessionRepository.save(session);
  }

  async removeFromCart(
    phoneNumber: string,
    itemId: number,
  ): Promise<WhatsAppSession> {
    const session = await this.getOrCreateSession(phoneNumber);
    const cart: CartItem[] = session.context?.cart || [];

    session.context = {
      ...session.context,
      cart: cart.filter((item) => item.itemId !== itemId),
    };

    return this.sessionRepository.save(session);
  }

  async clearCart(phoneNumber: string): Promise<WhatsAppSession> {
    const session = await this.getOrCreateSession(phoneNumber);
    session.context = {
      ...session.context,
      cart: [],
    };
    return this.sessionRepository.save(session);
  }

  async getCart(phoneNumber: string): Promise<CartItem[]> {
    const session = await this.getOrCreateSession(phoneNumber);
    return session.context?.cart || [];
  }

  async resetSession(phoneNumber: string): Promise<WhatsAppSession> {
    const session = await this.getOrCreateSession(phoneNumber);
    session.state = SessionState.MAIN_MENU;
    session.context = { cart: [] };
    return this.sessionRepository.save(session);
  }

  async updateLastMessageId(
    phoneNumber: string,
    messageId: string,
  ): Promise<void> {
    const session = await this.getOrCreateSession(phoneNumber);
    session.lastMessageId = messageId;
    await this.sessionRepository.save(session);
  }
}
