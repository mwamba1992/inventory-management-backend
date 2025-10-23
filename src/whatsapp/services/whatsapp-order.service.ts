import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WhatsAppOrder, OrderStatus } from '../entities/whatsapp-order.entity';
import { WhatsAppOrderItem } from '../entities/whatsapp-order-item.entity';
import { CreateWhatsAppOrderDto } from '../dto/create-order.dto';
import { ItemService } from '../../items/item/item.service';
import { CustomerService } from '../../settings/customer/customer.service';
import { WarehouseService } from '../../settings/warehouse/warehouse.service';
import { SaleService } from '../../sale/sale.service';
import { WhatsAppApiService } from './whatsapp-api.service';

@Injectable()
export class WhatsAppOrderService {
  private readonly logger = new Logger(WhatsAppOrderService.name);

  constructor(
    @InjectRepository(WhatsAppOrder)
    private readonly orderRepository: Repository<WhatsAppOrder>,
    @InjectRepository(WhatsAppOrderItem)
    private readonly orderItemRepository: Repository<WhatsAppOrderItem>,
    private readonly itemService: ItemService,
    private readonly customerService: CustomerService,
    private readonly warehouseService: WarehouseService,
    private readonly saleService: SaleService,
    private readonly whatsappApi: WhatsAppApiService,
  ) {}

  async createOrder(dto: CreateWhatsAppOrderDto): Promise<WhatsAppOrder> {
    this.logger.log(`Creating order for ${dto.customerPhone}`);

    // Validate warehouse
    const warehouse = await this.warehouseService.findOne(dto.warehouseId);
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Find customer
    const customers = await this.customerService.findAll();
    const customer = customers.find((c) => c.phone === dto.customerPhone);

    // Validate items and check stock
    const orderItems: WhatsAppOrderItem[] = [];
    let totalAmount = 0;

    for (const itemDto of dto.items) {
      const item = await this.itemService.findOne(itemDto.itemId);
      if (!item) {
        throw new NotFoundException(`Item with ID ${itemDto.itemId} not found`);
      }

      // Get active price
      const activePrice = item.prices?.find((p) => p.isActive);
      if (!activePrice) {
        throw new BadRequestException(`Item ${item.name} has no active price`);
      }

      // Check stock availability (but don't deduct yet - will deduct on delivery)
      const itemStock = item.stock?.[0];
      if (!itemStock || itemStock.quantity < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.name}. Available: ${itemStock?.quantity || 0}, Requested: ${itemDto.quantity}`,
        );
      }

      const unitPrice = activePrice.sellingPrice;
      const totalPrice = unitPrice * itemDto.quantity;
      totalAmount += totalPrice;

      const orderItem = this.orderItemRepository.create({
        item,
        quantity: itemDto.quantity,
        unitPrice,
        totalPrice,
      });

      orderItems.push(orderItem);

      this.logger.log(`Reserved ${itemDto.quantity} units of ${item.name} for order (stock will be deducted on delivery)`);
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      customerPhone: dto.customerPhone,
      customer,
      warehouse,
      items: orderItems,
      totalAmount,
      status: OrderStatus.PENDING,
      deliveryAddress: dto.deliveryAddress,
      notes: dto.notes,
    });

    const savedOrder = await this.orderRepository.save(order);
    this.logger.log(`Order created successfully: ${orderNumber}`);

    return savedOrder;
  }

  async findAll(): Promise<WhatsAppOrder[]> {
    return this.orderRepository.find({
      relations: ['customer', 'warehouse', 'items', 'items.item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<WhatsAppOrder> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'warehouse', 'items', 'items.item'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByPhone(phoneNumber: string): Promise<WhatsAppOrder[]> {
    return this.orderRepository.find({
      where: { customerPhone: phoneNumber },
      relations: ['customer', 'warehouse', 'items', 'items.item'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<WhatsAppOrder> {
    const order = await this.findOne(id);
    const previousStatus = order.status;
    order.status = status;

    if (status === OrderStatus.CONFIRMED && !order.confirmedAt) {
      order.confirmedAt = new Date();
    }

    // Handle delivery: Deduct stock and create sale records
    if (status === OrderStatus.DELIVERED && previousStatus !== OrderStatus.DELIVERED) {
      this.logger.log(`Processing delivery for order ${order.orderNumber}`);

      if (!order.deliveredAt) {
        order.deliveredAt = new Date();
      }

      // Get customer for sales records
      const customers = await this.customerService.findAll();
      const customer = customers.find((c) => c.phone === order.customerPhone);

      // Process each item: Deduct stock and create sale
      for (const orderItem of order.items) {
        const item = await this.itemService.findOne(orderItem.item.id);
        const itemStock = item.stock?.find((s) => s.warehouse?.id === order.warehouse.id);

        if (!itemStock) {
          throw new BadRequestException(
            `Stock not found for item ${item.name} in warehouse ${order.warehouse.name}`
          );
        }

        // Check if sufficient stock is available
        if (itemStock.quantity < orderItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${item.name}. Available: ${itemStock.quantity}, Required: ${orderItem.quantity}`
          );
        }

        // Deduct stock
        await this.itemService.updateItemStock(itemStock.id, {
          quantity: itemStock.quantity - orderItem.quantity,
        });

        this.logger.log(
          `Deducted ${orderItem.quantity} units of ${item.name}. Stock: ${itemStock.quantity} -> ${itemStock.quantity - orderItem.quantity}`
        );

        // Create sale record
        if (customer) {
          await this.saleService.create({
            customerId: customer.id,
            itemId: item.id,
            warehouseId: order.warehouse.id,
            quantity: orderItem.quantity,
            amountPaid: orderItem.totalPrice,
            remarks: `WhatsApp Order #${order.orderNumber}`,
          });

          this.logger.log(
            `Created sale record for ${item.name} (Order: ${order.orderNumber})`
          );
        }
      }

      this.logger.log(`Order ${order.orderNumber} delivered successfully`);
    }

    // Save order first
    const savedOrder = await this.orderRepository.save(order);

    // Send WhatsApp notification to customer about status change
    await this.sendStatusNotification(savedOrder, previousStatus, status);

    return savedOrder;
  }

  private async sendStatusNotification(
    order: WhatsAppOrder,
    previousStatus: OrderStatus,
    newStatus: OrderStatus,
  ): Promise<void> {
    try {
      let message = '';

      // Build order summary
      const itemsList = order.items
        .map((item) => `• ${item.item.name} x${item.quantity} - TZS ${item.totalPrice}`)
        .join('\n');

      switch (newStatus) {
        case OrderStatus.CONFIRMED:
          message = `✅ *Order Confirmed!*\n\n` +
            `Your order *#${order.orderNumber}* has been confirmed!\n\n` +
            `*Items:*\n${itemsList}\n\n` +
            `*Total:* TZS ${order.totalAmount}\n` +
            `*Delivery Address:* ${order.deliveryAddress || 'Not specified'}\n\n` +
            `We're preparing your order for delivery. You'll be notified when it's ready!`;
          break;

        case OrderStatus.PROCESSING:
          message = `⏳ *Order Processing*\n\n` +
            `Your order *#${order.orderNumber}* is being prepared.\n\n` +
            `We'll notify you when it's ready for delivery!`;
          break;

        case OrderStatus.READY:
          message = `📦 *Order Ready!*\n\n` +
            `Great news! Your order *#${order.orderNumber}* is ready for delivery!\n\n` +
            `*Items:*\n${itemsList}\n\n` +
            `*Total Amount:* TZS ${order.totalAmount}\n` +
            `*Payment:* Cash on Delivery\n\n` +
            `Our delivery team will contact you shortly!`;
          break;

        case OrderStatus.DELIVERED:
          message = `✅ *Order Delivered!*\n\n` +
            `Your order *#${order.orderNumber}* has been delivered successfully!\n\n` +
            `*Items:*\n${itemsList}\n\n` +
            `*Total Paid:* TZS ${order.totalAmount}\n\n` +
            `Thank you for shopping with us! 🎉\n\n` +
            `Type *menu* anytime to place a new order.`;
          break;

        case OrderStatus.CANCELLED:
          message = `❌ *Order Cancelled*\n\n` +
            `Your order *#${order.orderNumber}* has been cancelled.\n\n` +
            `If you have any questions, please contact us.\n\n` +
            `Type *menu* to place a new order.`;
          break;

        default:
          // No notification for other statuses
          return;
      }

      if (message) {
        await this.whatsappApi.sendTextMessage(order.customerPhone, message);
        this.logger.log(
          `Sent ${newStatus} notification to ${order.customerPhone} for order ${order.orderNumber}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send status notification for order ${order.orderNumber}: ${error.message}`,
        error.stack
      );
      // Don't throw error - notification failure shouldn't block status update
    }
  }

  async cancelOrder(id: number): Promise<WhatsAppOrder> {
    const order = await this.findOne(id);
    const previousStatus = order.status;

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a delivered order');
    }

    // No need to restore stock since it wasn't deducted yet
    // Stock is only deducted when order status changes to DELIVERED
    this.logger.log(`Cancelling order ${order.orderNumber}`);

    order.status = OrderStatus.CANCELLED;
    const savedOrder = await this.orderRepository.save(order);

    // Send cancellation notification to customer
    await this.sendStatusNotification(savedOrder, previousStatus, OrderStatus.CANCELLED);

    return savedOrder;
  }

  private async generateOrderNumber(): Promise<string> {
    const prefix = 'WA';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Get count of orders today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const todayOrdersCount = await this.orderRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const sequence = (todayOrdersCount + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}${day}${sequence}`;
  }

  async getOrderStats(): Promise<any> {
    const orders = await this.findAll();

    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      confirmed: orders.filter((o) => o.status === OrderStatus.CONFIRMED).length,
      processing: orders.filter((o) => o.status === OrderStatus.PROCESSING).length,
      ready: orders.filter((o) => o.status === OrderStatus.READY).length,
      delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
      totalRevenue: orders
        .filter((o) => o.status !== OrderStatus.CANCELLED)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0),
    };

    return stats;
  }
}
