import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppOrder, OrderStatus } from '../entities/whatsapp-order.entity';
import { WhatsAppOrderItem } from '../entities/whatsapp-order-item.entity';
import { CreateWhatsAppOrderDto } from '../dto/create-order.dto';
import { ItemService } from '../../items/item/item.service';
import { CustomerService } from '../../settings/customer/customer.service';
import { WarehouseService } from '../../settings/warehouse/warehouse.service';

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

      // Check stock
      const itemStock = item.stock?.find((s) => s.warehouse?.id === dto.warehouseId);
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

      // Update stock
      await this.itemService.updateItemStock(itemStock.id, {
        quantity: itemStock.quantity - itemDto.quantity,
      });

      this.logger.log(`Updated stock for item ${item.name}: ${itemStock.quantity} -> ${itemStock.quantity - itemDto.quantity}`);
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
    order.status = status;

    if (status === OrderStatus.CONFIRMED && !order.confirmedAt) {
      order.confirmedAt = new Date();
    }

    if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    return this.orderRepository.save(order);
  }

  async cancelOrder(id: number): Promise<WhatsAppOrder> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a delivered order');
    }

    // Restore stock
    for (const orderItem of order.items) {
      const item = await this.itemService.findOne(orderItem.item.id);
      const itemStock = item.stock?.find((s) => s.warehouse?.id === order.warehouse.id);

      if (itemStock) {
        await this.itemService.updateItemStock(itemStock.id, {
          quantity: itemStock.quantity + orderItem.quantity,
        });
        this.logger.log(`Restored stock for item ${item.name}: +${orderItem.quantity}`);
      }
    }

    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
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
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        } as any,
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
