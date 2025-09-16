// whatsapp.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import axios from 'axios';
import { Customer } from '../settings/customer/entities/customer.entity';
import { Item } from '../items/item/entities/item.entity';
import { Constants } from '../utils/constants';

@Injectable()
export class WhatsAppService {
  private readonly accessToken = Constants.WHATSAPP_TOKEN;
  private readonly phoneNumberId = Constants.WHATSAPP_NUMBER;
  private readonly apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
  ) {}

  // Main function to send product awareness messages
  async sendMarketMessageViaWhatsApp() {
    try {
      // Get customers with phone numbers
      const customers = await this.customerRepo.find({
        where: {
          phone: Not(IsNull()), // Only customers with phone numbers
        },
      });

      // Get available products/items in stock
      const products = await this.itemRepo.find({
        relations: ['stock'],
        where: {
          stock: {
            quantity: MoreThan(0), // Only items with stock
          },
        },
      });

      console.log(
        `Found ${customers.length} customers and ${products.length} products in stock`,
      );

      // Send messages to each customer
      for (const customer of customers) {
        await this.sendProductMessage(customer, products);

        // Wait 2 seconds between messages to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return {
        success: true,
        messagesSent: customers.length,
        productsPromoted: products.length,
      };
    } catch (error) {
      console.error('Error sending WhatsApp messages:', error);
      throw error;
    }
  }

  // Send individual message to customer
  private async sendProductMessage(customer: Customer, products: Item[]) {
    const message = this.createProductMessage(customer.name, products);

    const payload = {
      messaging_product: 'whatsapp',
      to: customer.phone,
      type: 'text',
      text: {
        body: message,
      },
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ Message sent to ${customer.name} (${customer.phone})`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Create the message content
  private createProductMessage(customerName: string, products: Item[]): string {
    const productList = products
      .slice(0, 5)
      .map((product) => `🔸 *${product.name}* - Available Now!`)
      .join('\n');

    return `👋 Hi ${customerName}!

🛍️ *New Stock Alert!*

We have fresh inventory available:

${productList}

💥 *Limited quantities!*

🛒 Visit us now or call to reserve.
📞 Call: [Your Store Number]
🏪 Store: [Your Store Name]

Thank you for being our valued customer! 🙏`;
  }

  // Send to specific customer (optional method)
  async sendToCustomer(customerId: number, message: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer || !customer.phone) {
      throw new Error('Customer not found or no phone number');
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: customer.phone,
      type: 'text',
      text: { body: message },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = await axios.post(this.apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response;
  }
}
