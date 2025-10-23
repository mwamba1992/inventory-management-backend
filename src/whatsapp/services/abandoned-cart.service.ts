import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { WhatsAppSession, SessionState } from '../entities/whatsapp-session.entity';
import { WhatsAppApiService } from './whatsapp-api.service';

@Injectable()
export class AbandonedCartService {
  private readonly logger = new Logger(AbandonedCartService.name);

  constructor(
    @InjectRepository(WhatsAppSession)
    private readonly sessionRepository: Repository<WhatsAppSession>,
    private readonly whatsappApi: WhatsAppApiService,
  ) {}

  /**
   * Check for abandoned carts every hour
   * Runs at the start of every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkAbandonedCarts() {
    this.logger.log('Checking for abandoned carts...');

    try {
      // Calculate 24 hours ago
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Find sessions with:
      // 1. Cart items present
      // 2. Not in checkout states
      // 3. Updated more than 24 hours ago
      // 4. Either never sent reminder OR last reminder was > 24 hours ago
      const abandonedSessions = await this.sessionRepository
        .createQueryBuilder('session')
        .where('session.updatedAt < :twentyFourHoursAgo', { twentyFourHoursAgo })
        .andWhere('session.state NOT IN (:...checkoutStates)', {
          checkoutStates: [
            SessionState.ENTERING_ADDRESS,
            SessionState.CONFIRMING_ORDER,
          ],
        })
        .andWhere(
          `JSON_EXTRACT(session.context, '$.cart') IS NOT NULL AND JSON_LENGTH(session.context, '$.cart') > 0`,
        )
        .andWhere(
          '(session.lastCartReminderAt IS NULL OR session.lastCartReminderAt < :twentyFourHoursAgo)',
          { twentyFourHoursAgo },
        )
        .getMany();

      this.logger.log(`Found ${abandonedSessions.length} abandoned carts`);

      for (const session of abandonedSessions) {
        await this.sendAbandonedCartReminder(session);
      }

      this.logger.log('Abandoned cart check completed');
    } catch (error) {
      this.logger.error(`Error checking abandoned carts: ${error.message}`, error.stack);
    }
  }

  /**
   * Send abandoned cart reminder to customer
   */
  private async sendAbandonedCartReminder(session: WhatsAppSession): Promise<void> {
    try {
      const cart = session.context?.cart || [];

      if (cart.length === 0) {
        return;
      }

      // Calculate cart total
      const total = cart.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

      // Build reminder message
      let message = '🛒 *You have items in your cart!*\n\n';
      message += `You left ${cart.length} item(s) in your cart:\n\n`;

      cart.forEach((item: any, index: number) => {
        message += `${index + 1}. ${item.itemName}\n`;
        message += `   Qty: ${item.quantity} × TZS ${item.unitPrice}\n`;
      });

      message += `\n💰 *Total: TZS ${total.toFixed(2)}*\n\n`;
      message += `Complete your order now!\n`;
      message += `Type *cart* to review and checkout.\n\n`;
      message += `Need help? Type *menu* to start over.`;

      // Send reminder message
      await this.whatsappApi.sendTextMessage(session.phoneNumber, message);

      // Update last reminder timestamp
      session.lastCartReminderAt = new Date();
      await this.sessionRepository.save(session);

      this.logger.log(`Sent abandoned cart reminder to ${session.phoneNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to send abandoned cart reminder to ${session.phoneNumber}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manual trigger for testing (can be called from controller)
   */
  async triggerAbandonedCartCheck(): Promise<{ sent: number; message: string }> {
    this.logger.log('Manual trigger: Checking for abandoned carts');
    await this.checkAbandonedCarts();
    return {
      sent: 0, // You can track this if needed
      message: 'Abandoned cart check triggered',
    };
  }
}
