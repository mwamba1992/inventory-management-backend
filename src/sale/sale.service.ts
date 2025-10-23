// src/sale/sale.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Customer } from '../settings/customer/entities/customer.entity';
import { Item } from '../items/item/entities/item.entity';
import { Warehouse } from '../settings/warehouse/entities/warehouse.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { OrderNotificationService } from '../whatsapp/services/order-notification.service';


@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Warehouse)
    private readonly wareHouseRepository: Repository<Warehouse>,
    @InjectRepository(ItemStock)
    private readonly itemStockRepo: Repository<ItemStock>,
    @Inject(forwardRef(() => OrderNotificationService))
    private readonly orderNotificationService: OrderNotificationService,
  ) {}

  // sale.service.ts
  async create(dto: CreateSaleDto) {
    const customer = await this.customerRepo.findOneBy({ id: dto.customerId });
    const item = await this.itemRepo.findOneBy({ id: dto.itemId });
    const warehouse = await this.wareHouseRepository.findOneBy({
      id: dto.warehouseId,
    });

    if (!customer) throw new NotFoundException('Customer not found');
    if (!item) throw new NotFoundException('Item not found');
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const quantity = dto.quantity;

    // get stock
    const stock = await this.itemStockRepo.findOne({
      where: { item: { id: item.id }, warehouse: { id: warehouse.id } },
    });

    // @ts-expect-error
    if (!stock || stock.quantity < quantity) {
      throw new BadRequestException('Insufficient stock in selected warehouse');
    }

    // reduce inventory
    // @ts-expect-error
    stock.quantity -= quantity;
    await this.itemStockRepo.save(stock);

    // update sales  account

    // create sale
    const sale = this.saleRepo.create({
      customer: customer,
      item: item,
      warehouseId: warehouse,
      quantity: quantity,
      amountPaid: dto.amountPaid,
      remarks: dto.remarks,
      createdAt: new Date(), // createdAt
      updatedAt: new Date(), // updatedAt
    });
    return this.saleRepo.save(sale);
  }

  findAll() {
    return this.saleRepo.find();
  }

  async findOne(id: number) {
    const sale = await this.saleRepo.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async update(id: number, dto: UpdateSaleDto) {
    await this.findOne(id);
    const customer = dto.customerId
      ? await this.customerRepo.findOneBy({ id: dto.customerId })
      : undefined;
    const item = dto.itemId
      ? await this.itemRepo.findOneBy({ id: dto.itemId })
      : undefined;

    const updateData: any = {
      amountPaid: dto.amountPaid,
      remarks: dto.remarks,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (customer) updateData.customer = customer;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (item) updateData.item = item;

    await this.saleRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.saleRepo.delete(id);
  }

  /**
   * Update sale status and send WhatsApp template notification
   * Used for manual/phone orders to notify customers about order status
   */
  async updateSaleStatus(id: number, status: SaleStatus): Promise<Sale> {
    this.logger.log(`Updating sale ${id} status to ${status}`);

    // Find sale with all relations
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations: ['customer', 'item', 'warehouseId'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const previousStatus = sale.status;
    sale.status = status;

    // Update deliveredAt timestamp when status changes to DELIVERED
    if (status === SaleStatus.DELIVERED && !sale.deliveredAt) {
      sale.deliveredAt = new Date();
      this.logger.log(`Setting deliveredAt for sale ${id}`);
    }

    // Save the updated sale
    const updatedSale = await this.saleRepo.save(sale);

    // Send WhatsApp notification (template message)
    try {
      if (!sale.whatsappNotified) {
        this.logger.log(
          `Sending WhatsApp notification to ${sale.customer.phone} for sale ${id}`
        );

        const sent = await this.orderNotificationService.sendStatusNotification(
          sale,
          status,
        );

        if (sent) {
          // Mark as notified
          sale.whatsappNotified = true;
          await this.saleRepo.save(sale);
          this.logger.log(`Sale ${id} marked as WhatsApp notified`);
        }
      } else {
        this.logger.log(`Sale ${id} already notified via WhatsApp, skipping notification`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp notification for sale ${id}: ${error.message}`,
        error.stack
      );
      // Don't throw - notification failure shouldn't block status update
    }

    this.logger.log(`Sale ${id} status updated from ${previousStatus} to ${status}`);
    return updatedSale;
  }

  async fetchRecentSales(limit: number = 10) {
    const sales = await this.saleRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['customer', 'item', 'warehouseId'],
    });

    if (!sales || sales.length === 0) {
      throw new NotFoundException('No recent sales found');
    }

    return sales;
  }

  async totalSales() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const total = await this.saleRepo
      .createQueryBuilder('sale')
      .select('SUM(sale.amountPaid)', 'totalSales')
      .getRawOne();

    if (!total) {
      throw new NotFoundException('No sales found');
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      totalSales: total.totalSales || 0,
    };
  }

  async totalSaleCount() {
    return await this.saleRepo.count();
  }

  async weeklySalesTrends() {
    const rawSales = await this.saleRepo
      .createQueryBuilder('sale')
      .select(`TO_CHAR(sale."createdAt", 'Dy')`, 'day')
      .addSelect('SUM(sale.amountPaid)', 'amount')
      .where(
        `sale."createdAt" >= DATE_TRUNC('week', NOW() + INTERVAL '1 day') - INTERVAL '1 day'`,
      )
      .andWhere(
        `sale."createdAt" < DATE_TRUNC('week', NOW() + INTERVAL '1 day') + INTERVAL '6 days'`,
      )
      .groupBy('day')
      .orderBy(`MIN(sale."createdAt")`, 'ASC')
      .getRawMany();

    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const salesMap = Object.fromEntries(daysOrder.map((day) => [day, 0]));

    rawSales.forEach((sale) => {
      const day = sale.day.trim(); // 'Mon', 'Tue', etc.
      if (salesMap[day] !== undefined) {
        salesMap[day] = parseFloat(sale.amount);
      }
    });

    const maxAmount = Math.max(...Object.values(salesMap));

    const salesTrends = daysOrder.map((day) => ({
      day,
      amount: salesMap[day],
      percentage:
        maxAmount > 0 ? Math.round((salesMap[day] / maxAmount) * 100) : 0,
    }));

    return salesTrends;
  }
  /**
   * Fetches the top products by sales amount.
   * @param limit - The number of top products to fetch (default is 5).
   * @returns An array of objects containing item details and total sales amount.
   */
  async topProductsBySales(limit: number = 5) {
    const rawSales = await this.saleRepo
      .createQueryBuilder('sale')
      .select('sale.item_id', 'itemid')
      .addSelect('SUM(sale.amountPaid)', 'totalsales')
      .addSelect('SUM(sale.quantity)', 'totalquantity') // include total quantity sold
      .groupBy('sale.item_id')
      .orderBy('totalsales', 'DESC')
      .limit(limit)
      .getRawMany();

    if (!rawSales || rawSales.length === 0) {
      throw new NotFoundException('No sales data found');
    }

    return await Promise.all(
      rawSales.map(async (sale) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        const item = await this.itemRepo.findOneBy({ id: sale.itemid });
        return {
          item,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          totalSales: parseFloat(sale.totalsales),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          totalQuantity: parseInt(sale.totalquantity, 10),
        };
      }),
    );
  }

  async getSaleMetrics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growthStartDate = new Date();
    growthStartDate.setDate(startDate.getDate() - days);

    console.log(
      `Fetching sales metrics from ${startDate.toISOString()} to now`,
    );

    const sales = await this.saleRepo
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('SUM(sale.amountPaid)', 'totalSales')
      .addSelect('COUNT(sale.id)', 'totalCount')
      .where('sale.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const growthSales = await this.saleRepo
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('SUM(sale.amountPaid)', 'totalSales')
      .addSelect('COUNT(sale.id)', 'totalCount')
      .where('sale.createdAt >= :growthStartDate', { growthStartDate })
      .andWhere('sale.createdAt < :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    console.log(`Fetched ${sales.length} sales records`);
    console.log(sales);

    if (!sales || sales.length === 0) {
      return {
        units: 0,
        total: 0,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const current = parseFloat(sales[0].totalSales) || 0;

    let previous = 0;
    if (growthSales.length > 0) {
      previous = parseFloat(growthSales[0].totalSales) || 0;
    }

    let growth = 0;
    if (previous > 0) {
      growth = ((current - previous) / previous) * 100;
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
      total: parseFloat(sales[0].totalSales),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
      units: parseInt(sales[0].totalCount, 10),

      growth: growth,
    };
  }

  async getSalesWithinNumberOfDays(days: number = 30): Promise<Sale[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`Fetching sales from ${startDate.toISOString()} to now`);

    const sales = await this.saleRepo.find({
      where: {
        createdAt: MoreThanOrEqual(startDate),
      },
      relations: ['customer', 'item', 'warehouseId'],
      order: { createdAt: 'DESC' },
    });

    console.log(`Fetched ${sales.length} sales records`);
    return sales;
  }

  async findSalesByDateRange(startDate?: string, endDate?: string): Promise<Sale[]> {
    let whereCondition: any = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      whereCondition.createdAt = Between(start, end);
    } else if (startDate) {
      const start = new Date(startDate);
      whereCondition.createdAt = MoreThanOrEqual(start);
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      whereCondition.createdAt = LessThan(end);
    }

    const sales = await this.saleRepo.find({
      where: whereCondition,
      relations: ['customer', 'item', 'warehouseId'],
      order: { createdAt: 'DESC' },
    });

    return sales;
  }

}
