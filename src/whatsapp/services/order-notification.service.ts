import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppApiService } from './whatsapp-api.service';
import { WhatsAppOrder } from '../entities/whatsapp-order.entity';
import { Sale } from '../../sale/entities/sale.entity';
import { BeemSmsService } from '../../beem-sms/beem-sms.service';

@Injectable()
export class OrderNotificationService {
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(
    private readonly whatsappApi: WhatsAppApiService,
    private readonly beemSms: BeemSmsService,
  ) {}

  // Hard cap at 2 SMS parts to control Beem cost.
  // GSM-7 multipart: 153 chars/part. UCS-2 (Unicode): 67 chars/part.
  private static readonly MAX_GSM_CHARS = 305;
  private static readonly MAX_UCS_CHARS = 134;

  private capSmsLength(message: string, items: string): string {
    const isUnicode = /[^\x00-\x7F]/.test(message);
    const max = isUnicode
      ? OrderNotificationService.MAX_UCS_CHARS
      : OrderNotificationService.MAX_GSM_CHARS;
    if (message.length <= max) return message;

    // Try shrinking the items list — that's the only field that varies wildly.
    const overflow = message.length - max;
    const minItemsLen = 5;
    if (items && items.length - overflow - 3 >= minItemsLen) {
      const truncatedItems = items.slice(0, items.length - overflow - 3) + '...';
      return message.replace(`Bidhaa: ${items}`, `Bidhaa: ${truncatedItems}`);
    }

    // Fallback: hard cut (preserves structure of last line where possible).
    return message.slice(0, max - 3) + '...';
  }

  private buildSmsMessage(status: string, data: {
    customerName: string;
    orderNumber: string;
    items: string;
    total: string;
    deliveryAddress: string;
  }): string {
    const name = data.customerName.split(' ')[0] || 'Mteja';
    const totalNum = Number(data.total);
    const total = isNaN(totalNum)
      ? data.total
      : Math.round(totalNum).toLocaleString('en-US');
    const support = '0789947608';

    let msg: string;
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'pending':
        msg = `Habari ${name}, tumepokea oda yako #${data.orderNumber}.\nBidhaa: ${data.items}\nJumla: TZS ${total}\nAsante kwa kununua Global Authentics TZ!\nMsaada: ${support} (Simu/WhatsApp)`;
        break;
      case 'processing':
      case 'ready':
        msg = `Habari ${name}, oda yako #${data.orderNumber} inasafirishwa.\nBidhaa: ${data.items}\nJumla: TZS ${total}\nTutawasiliana nawe hivi karibuni.\nMsaada: ${support} (Simu/WhatsApp)`;
        break;
      case 'delivered':
        msg = `Habari ${name}, oda yako #${data.orderNumber} imefikishwa salama.\nBidhaa: ${data.items}\nJumla: TZS ${total}\nAsante kwa kununua, karibu tena Global Authentics TZ!\nMaswali/Msaada: ${support} (Simu/WhatsApp)`;
        break;
      case 'cancelled':
        msg = `Habari ${name}, oda yako #${data.orderNumber} imesitishwa.\nBidhaa: ${data.items}\nTafadhali piga ${support} (Simu/WhatsApp) kwa maelezo zaidi.`;
        break;
      default:
        msg = `Habari ${name}, hali ya oda yako #${data.orderNumber} imebadilika kuwa: ${status}.\nMaswali: ${support} (Simu/WhatsApp)`;
        break;
    }

    return this.capSmsLength(msg, data.items);
  }

  /**
   * Send order confirmation template (account_update)
   * Sent when order is confirmed/created
   */
  async sendOrderConfirmation(
    order: WhatsAppOrder | Sale,
  ): Promise<boolean> {
    try {
      const { phoneNumber, customerName, orderNumber, items, total } =
        this.extractOrderData(order);

      this.logger.log(
        `Sending order confirmation template to ${phoneNumber} for order ${orderNumber}`,
      );

      await this.whatsappApi.sendTemplateMessage(
        phoneNumber,
        'account_update',
        'en',
        [
          customerName, // {{1}} - Customer name
          orderNumber, // {{2}} - Order number
          items, // {{3}} - Items list
          total, // {{4}} - Total amount
        ],
      );

      this.logger.log(`Order confirmation sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Send order ready/out for delivery template
   * Sent when order is ready to be shipped or out for delivery
   */
  async sendOrderReady(order: WhatsAppOrder | Sale): Promise<boolean> {
    try {
      const { phoneNumber, customerName, orderNumber, deliveryAddress, total } =
        this.extractOrderData(order);

      this.logger.log(
        `Sending order ready template to ${phoneNumber} for order ${orderNumber}`,
      );

      await this.whatsappApi.sendTemplateMessage(
        phoneNumber,
        'order_out_for_delivery',
        'en',
        [
          customerName, // {{1}} - Customer name
          orderNumber, // {{2}} - Order number
          deliveryAddress, // {{3}} - Delivery address
          total, // {{4}} - Total amount
        ],
      );

      this.logger.log(`Order ready notification sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send order ready notification: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Send order delivered template
   * Sent when order is successfully delivered
   */
  async sendOrderDelivered(order: WhatsAppOrder | Sale): Promise<boolean> {
    try {
      const { phoneNumber, customerName, orderNumber, total } =
        this.extractOrderData(order);

      this.logger.log(
        `Sending order delivered template to ${phoneNumber} for order ${orderNumber}`,
      );

      await this.whatsappApi.sendTemplateMessage(
        phoneNumber,
        'order_delivered',
        'en',
        [
          customerName, // {{1}} - Customer name
          orderNumber, // {{2}} - Order number
          total, // {{3}} - Total paid
        ],
      );

      this.logger.log(`Order delivered notification sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send order delivered notification: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Extract common data from either WhatsAppOrder or Sale entity
   * Handles differences between the two order types
   */
  private extractOrderData(order: WhatsAppOrder | Sale): {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    items: string;
    total: string;
    deliveryAddress: string;
  } {
    // Check if it's a WhatsAppOrder (has items array and orderNumber)
    const isWhatsAppOrder = 'orderNumber' in order && 'items' in order;

    if (isWhatsAppOrder) {
      const whatsappOrder = order as WhatsAppOrder;

      // Format items list
      const itemsList = whatsappOrder.items
        .map((item) => `${item.item.name} x${item.quantity}`)
        .join(', ');

      return {
        phoneNumber: whatsappOrder.customer.phone,
        customerName: whatsappOrder.customer.name,
        orderNumber: whatsappOrder.orderNumber,
        items: itemsList,
        total: Number(whatsappOrder.totalAmount).toFixed(2),
        deliveryAddress: whatsappOrder.deliveryAddress || 'N/A',
      };
    } else {
      // It's a regular Sale
      const sale = order as Sale;

      // Format items for single sale item
      const itemsList = `${sale.item.name} x${sale.quantity}`;

      return {
        phoneNumber: sale.customer.phone,
        customerName: sale.customer.name,
        orderNumber: `SALE-${sale.id}`,
        items: itemsList,
        total: Number(sale.amountPaid).toFixed(2),
        deliveryAddress: 'To be confirmed', // Sales don't have delivery address field
      };
    }
  }

  /**
   * Send notification based on order status — SMS sent on delivered only
   */
  async sendStatusNotification(
    order: WhatsAppOrder | Sale,
    status: string,
  ): Promise<boolean> {
    if (status.toLowerCase() !== 'delivered') {
      this.logger.log(`Skipping SMS for status "${status}" — only sent on delivered`);
      return false;
    }

    const data = this.extractOrderData(order);
    const message = this.buildSmsMessage(status, data);

    this.logger.log(
      `Sending delivery SMS for ${data.orderNumber} to ${data.phoneNumber}`,
    );

    return this.beemSms.sendSms(
      data.phoneNumber,
      message,
      `sale:delivered`,
      data.orderNumber,
    );
  }
}
