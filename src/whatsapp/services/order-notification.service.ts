import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppApiService } from './whatsapp-api.service';
import { WhatsAppOrder } from '../entities/whatsapp-order.entity';
import { Sale } from '../../sale/entities/sale.entity';

@Injectable()
export class OrderNotificationService {
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(private readonly whatsappApi: WhatsAppApiService) {}

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
        total: whatsappOrder.totalAmount.toFixed(2),
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
        total: sale.amountPaid.toFixed(2),
        deliveryAddress: 'To be confirmed', // Sales don't have delivery address field
      };
    }
  }

  /**
   * Send notification based on order status
   * Automatically determines which template to send
   */
  async sendStatusNotification(
    order: WhatsAppOrder | Sale,
    status: string,
  ): Promise<boolean> {
    this.logger.log(`Sending status notification for status: ${status}`);

    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'pending':
        return await this.sendOrderConfirmation(order);

      case 'processing':
      case 'ready':
        return await this.sendOrderReady(order);

      case 'delivered':
        return await this.sendOrderDelivered(order);

      default:
        this.logger.warn(`No template configured for status: ${status}`);
        return false;
    }
  }
}
