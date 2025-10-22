import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Sale } from '../sale/entities/sale.entity';
import { WhatsAppOrder } from '../whatsapp/entities/whatsapp-order.entity';
import { Customer } from '../settings/customer/entities/customer.entity';
import { Item } from '../items/item/entities/item.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { WhatsAppOrderItem } from '../whatsapp/entities/whatsapp-order-item.entity';
import { Expense } from '../expense/entities/expense.entity';
import {
  BusinessOverviewReport,
  MetricValue,
  SalesTrendDataPoint,
  TopProduct,
  SalesReport,
  InventoryReport,
  CustomerReport,
  FinancialReport,
} from './interfaces/report.interface';
import { DateRange, ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(WhatsAppOrder)
    private readonly whatsappOrderRepository: Repository<WhatsAppOrder>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(ItemStock)
    private readonly itemStockRepository: Repository<ItemStock>,
    @InjectRepository(WhatsAppOrderItem)
    private readonly whatsappOrderItemRepository: Repository<WhatsAppOrderItem>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  /**
   * Get date range based on filter
   */
  private getDateRange(filter: ReportFilterDto): {
    startDate: Date;
    endDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (filter.startDate && filter.endDate) {
      startDate = new Date(filter.startDate);
      endDate = new Date(filter.endDate);
    } else {
      switch (filter.dateRange) {
        case DateRange.LAST_7_DAYS:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case DateRange.LAST_30_DAYS:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        case DateRange.LAST_90_DAYS:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
          break;
        case DateRange.THIS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case DateRange.LAST_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case DateRange.THIS_YEAR:
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
      }
    }

    // Calculate previous period for comparison
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  /**
   * Get business overview report
   */
  async getBusinessOverview(
    filter: ReportFilterDto,
  ): Promise<BusinessOverviewReport> {
    const { startDate, endDate, previousStartDate, previousEndDate } =
      this.getDateRange(filter);

    // Get current period data
    const [currentRevenue, currentOrders, currentCustomers] = await Promise.all(
      [
        this.getTotalRevenue(startDate, endDate, filter.businessId),
        this.getTotalOrders(startDate, endDate, filter.businessId),
        this.getActiveCustomers(startDate, endDate, filter.businessId),
      ],
    );

    // Get previous period data for comparison
    const [previousRevenue, previousOrders, previousCustomers] =
      await Promise.all([
        this.getTotalRevenue(
          previousStartDate,
          previousEndDate,
          filter.businessId,
        ),
        this.getTotalOrders(
          previousStartDate,
          previousEndDate,
          filter.businessId,
        ),
        this.getActiveCustomers(
          previousStartDate,
          previousEndDate,
          filter.businessId,
        ),
      ]);

    // Calculate average order values
    const currentAvgOrderValue =
      currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const previousAvgOrderValue =
      previousOrders > 0 ? previousRevenue / previousOrders : 0;

    // Get sales trend and top products
    const [salesTrend, topProducts] = await Promise.all([
      this.getSalesTrend(startDate, endDate, filter.businessId),
      this.getTopProducts(startDate, endDate, filter.businessId, 10),
    ]);

    const period = this.getPeriodLabel(
      filter.dateRange || DateRange.LAST_30_DAYS,
    );

    return {
      totalRevenue: {
        current: currentRevenue,
        previous: previousRevenue,
        percentageChange: this.calculatePercentageChange(
          currentRevenue,
          previousRevenue,
        ),
        label: 'Total Revenue',
        period,
      },
      totalOrders: {
        current: currentOrders,
        previous: previousOrders,
        percentageChange: this.calculatePercentageChange(
          currentOrders,
          previousOrders,
        ),
        label: 'Total Orders',
        period,
      },
      activeCustomers: {
        current: currentCustomers,
        previous: previousCustomers,
        percentageChange: this.calculatePercentageChange(
          currentCustomers,
          previousCustomers,
        ),
        label: 'Active Customers',
        period,
      },
      avgOrderValue: {
        current: Number(currentAvgOrderValue.toFixed(2)),
        previous: Number(previousAvgOrderValue.toFixed(2)),
        percentageChange: this.calculatePercentageChange(
          currentAvgOrderValue,
          previousAvgOrderValue,
        ),
        label: 'Avg Order Value',
        period,
      },
      salesTrend,
      topProducts,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };
  }

  /**
   * Get period label
   */
  private getPeriodLabel(dateRange: DateRange): string {
    const labels = {
      [DateRange.LAST_7_DAYS]: 'Last 7 days',
      [DateRange.LAST_30_DAYS]: 'Last 30 days',
      [DateRange.LAST_90_DAYS]: 'Last 90 days',
      [DateRange.THIS_MONTH]: 'This month',
      [DateRange.LAST_MONTH]: 'Last month',
      [DateRange.THIS_YEAR]: 'This year',
      [DateRange.CUSTOM]: 'Custom range',
    };
    return labels[dateRange] || 'Last 30 days';
  }

  /**
   * Get total revenue from sales and WhatsApp orders
   */
  private async getTotalRevenue(
    startDate: Date,
    endDate: Date,
    businessId?: number,
  ): Promise<number> {
    // Revenue from regular sales (use amountPaid field)
    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.amountPaid), 0)', 'total')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    const salesResult = await salesQuery.getRawOne();

    // Revenue from WhatsApp orders (only confirmed/delivered orders)
    const whatsappQuery = this.whatsappOrderRepository
      .createQueryBuilder('wo')
      .select('COALESCE(SUM(wo.totalAmount), 0)', 'total')
      .where('wo.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('wo.status IN (:...statuses)', {
        statuses: ['confirmed', 'processing', 'ready', 'delivered'],
      });

    const whatsappResult = await whatsappQuery.getRawOne();

    return (
      Number(salesResult?.total || 0) + Number(whatsappResult?.total || 0)
    );
  }

  /**
   * Get total number of orders
   */
  private async getTotalOrders(
    startDate: Date,
    endDate: Date,
    businessId?: number,
  ): Promise<number> {
    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    const salesCount = await salesQuery.getCount();

    const whatsappCount = await this.whatsappOrderRepository
      .createQueryBuilder('wo')
      .where('wo.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('wo.status != :status', { status: 'cancelled' })
      .getCount();

    return salesCount + whatsappCount;
  }

  /**
   * Get number of active customers (customers who made purchases)
   */
  private async getActiveCustomers(
    startDate: Date,
    endDate: Date,
    businessId?: number,
  ): Promise<number> {
    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.customer', 'customer')
      .select('DISTINCT customer.id')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('customer.id IS NOT NULL');

    const salesCustomers = await salesQuery.getRawMany();

    const whatsappCustomers = await this.whatsappOrderRepository
      .createQueryBuilder('wo')
      .select('DISTINCT wo.customer_id', 'customer_id')
      .where('wo.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('wo.customer_id IS NOT NULL')
      .andWhere('wo.status != :status', { status: 'cancelled' })
      .getRawMany();

    // Combine and deduplicate customer IDs
    const uniqueCustomerIds = new Set([
      ...salesCustomers.map((c) => c.customer_id).filter((id) => id),
      ...whatsappCustomers.map((c) => c.customer_id).filter((id) => id),
    ]);

    return uniqueCustomerIds.size;
  }

  /**
   * Get sales trend data (daily aggregation)
   */
  private async getSalesTrend(
    startDate: Date,
    endDate: Date,
    businessId?: number,
  ): Promise<SalesTrendDataPoint[]> {
    // Get sales data
    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('COALESCE(SUM(sale.amountPaid), 0)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(sale.createdAt)')
      .orderBy('date', 'ASC');

    const salesData = await salesQuery.getRawMany();

    // Get WhatsApp orders data
    const whatsappData = await this.whatsappOrderRepository
      .createQueryBuilder('wo')
      .select('DATE(wo.createdAt)', 'date')
      .addSelect('COALESCE(SUM(wo.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('wo.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('wo.status != :status', { status: 'cancelled' })
      .groupBy('DATE(wo.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Merge data by date
    const dataMap = new Map<string, SalesTrendDataPoint>();

    salesData.forEach((item) => {
      dataMap.set(item.date, {
        date: item.date,
        revenue: Number(item.revenue),
        orders: Number(item.orders),
      });
    });

    whatsappData.forEach((item) => {
      const existing = dataMap.get(item.date);
      if (existing) {
        existing.revenue += Number(item.revenue);
        existing.orders += Number(item.orders);
      } else {
        dataMap.set(item.date, {
          date: item.date,
          revenue: Number(item.revenue),
          orders: Number(item.orders),
        });
      }
    });

    return Array.from(dataMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }

  /**
   * Get top products by revenue
   */
  private async getTopProducts(
    startDate: Date,
    endDate: Date,
    businessId?: number,
    limit: number = 10,
  ): Promise<TopProduct[]> {
    // Get top products from regular sales (Sale has direct Item relationship)
    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.item', 'item')
      .select('item.id', 'id')
      .addSelect('item.name', 'name')
      .addSelect('item.code', 'code')
      .addSelect('COALESCE(SUM(sale.amountPaid), 0)', 'revenue')
      .addSelect('COALESCE(SUM(sale.quantity), 0)', 'quantitySold')
      .addSelect('COUNT(sale.id)', 'orderCount')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('item.id IS NOT NULL')
      .groupBy('item.id')
      .addGroupBy('item.name')
      .addGroupBy('item.code');

    const salesProducts = await salesQuery.getRawMany();

    // Get top products from WhatsApp orders
    const whatsappProducts = await this.whatsappOrderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.item', 'item')
      .select('item.id', 'id')
      .addSelect('item.name', 'name')
      .addSelect('item.code', 'code')
      .addSelect('COALESCE(SUM(orderItem.totalPrice), 0)', 'revenue')
      .addSelect('COALESCE(SUM(orderItem.quantity), 0)', 'quantitySold')
      .addSelect('COUNT(DISTINCT order.id)', 'orderCount')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status != :status', { status: 'cancelled' })
      .groupBy('item.id')
      .addGroupBy('item.name')
      .addGroupBy('item.code')
      .getRawMany();

    // Merge products data
    const productMap = new Map<number, TopProduct>();

    [...salesProducts, ...whatsappProducts].forEach((item) => {
      const existing = productMap.get(item.id);
      if (existing) {
        existing.revenue += Number(item.revenue);
        existing.quantitySold += Number(item.quantitySold);
        existing.orderCount += Number(item.orderCount);
      } else {
        productMap.set(item.id, {
          id: item.id,
          name: item.name,
          code: item.code,
          revenue: Number(item.revenue),
          quantitySold: Number(item.quantitySold),
          orderCount: Number(item.orderCount),
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(filter: ReportFilterDto): Promise<InventoryReport> {
    const totalItems = await this.itemRepository.count();

    const stockData = await this.itemStockRepository.find({
      relations: ['item', 'item.prices', 'item.category', 'warehouse'],
    });

    const totalStockValue = stockData.reduce((total, stock) => {
      const activePrice = stock.item.prices?.find((p) => p.isActive);
      const price = activePrice?.sellingPrice || 0;
      return total + stock.quantity * price;
    }, 0);

    const lowStockItems = stockData.filter(
      (stock) => stock.quantity > 0 && stock.quantity <= stock.reorderPoint,
    ).length;

    const outOfStockItems = stockData.filter(
      (stock) => stock.quantity === 0,
    ).length;

    // Group by category
    const categoryMap = new Map<
      string,
      { count: number; value: number; quantity: number }
    >();

    stockData.forEach((stock) => {
      const categoryName = stock.item.category?.description || 'Uncategorized';
      const activePrice = stock.item.prices?.find((p) => p.isActive);
      const value = (activePrice?.sellingPrice || 0) * stock.quantity;

      const existing = categoryMap.get(categoryName);
      if (existing) {
        existing.count += 1;
        existing.value += value;
        existing.quantity += stock.quantity;
      } else {
        categoryMap.set(categoryName, {
          count: 1,
          value,
          quantity: stock.quantity,
        });
      }
    });

    const itemsByCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        count: data.count,
        value: Number(data.value.toFixed(2)),
      }),
    );

    // Map detailed items
    const items = stockData.map((stock) => {
      const activePrice = stock.item.prices?.find((p) => p.isActive);
      const sellingPrice = activePrice?.sellingPrice || 0;
      const value = sellingPrice * stock.quantity;

      let status: 'In Stock' | 'Low Stock' | 'Out of Stock';
      if (stock.quantity === 0) {
        status = 'Out of Stock';
      } else if (stock.quantity <= stock.reorderPoint) {
        status = 'Low Stock';
      } else {
        status = 'In Stock';
      }

      return {
        id: stock.id,
        productName: stock.item.name,
        productCode: stock.item.code || '',
        currentStock: stock.quantity,
        minStock: stock.reorderPoint || 0,
        value: Number(value.toFixed(2)),
        warehouse: stock.warehouse?.name || 'N/A',
        status,
        category: stock.item.category?.description || 'Uncategorized',
      };
    });

    return {
      totalItems,
      totalStockValue: Number(totalStockValue.toFixed(2)),
      lowStockItems,
      outOfStockItems,
      itemsByCategory,
      items,
    };
  }

  /**
   * Get customer report
   */
  async getCustomerReport(filter: ReportFilterDto): Promise<CustomerReport> {
    const { startDate, endDate } = this.getDateRange(filter);

    const totalCustomers = await this.customerRepository.count();

    const newCustomers = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getCount();

    const activeCustomers = await this.getActiveCustomers(
      startDate,
      endDate,
      filter.businessId,
    );

    // Get top customers by total spent (with phone and last order)
    const topCustomersFromSales = await this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.customer', 'customer')
      .select('customer.id', 'id')
      .addSelect('customer.name', 'name')
      .addSelect('customer.phone', 'phone')
      .addSelect('COUNT(sale.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(sale.amountPaid), 0)', 'totalSpent')
      .addSelect('MAX(sale.createdAt)', 'lastOrder')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('customer.id IS NOT NULL')
      .groupBy('customer.id')
      .addGroupBy('customer.name')
      .addGroupBy('customer.phone')
      .getRawMany();

    const topCustomersFromWhatsApp = await this.whatsappOrderRepository
      .createQueryBuilder('wo')
      .leftJoin('wo.customer', 'customer')
      .select('customer.id', 'id')
      .addSelect('customer.name', 'name')
      .addSelect('customer.phone', 'phone')
      .addSelect('COUNT(wo.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(wo.totalAmount), 0)', 'totalSpent')
      .addSelect('MAX(wo.createdAt)', 'lastOrder')
      .where('wo.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('customer.id IS NOT NULL')
      .andWhere('wo.status != :status', { status: 'cancelled' })
      .groupBy('customer.id')
      .addGroupBy('customer.name')
      .addGroupBy('customer.phone')
      .getRawMany();

    // Merge top customers
    const customerMap = new Map<
      number,
      {
        id: number;
        name: string;
        phone: string;
        totalOrders: number;
        totalSpent: number;
        lastOrder: Date;
      }
    >();

    [...topCustomersFromSales, ...topCustomersFromWhatsApp].forEach((item) => {
      const existing = customerMap.get(item.id);
      if (existing) {
        existing.totalOrders += Number(item.totalOrders);
        existing.totalSpent += Number(item.totalSpent);
        // Keep the most recent lastOrder
        if (new Date(item.lastOrder) > existing.lastOrder) {
          existing.lastOrder = new Date(item.lastOrder);
        }
      } else {
        customerMap.set(item.id, {
          id: item.id,
          name: item.name,
          phone: item.phone || '',
          totalOrders: Number(item.totalOrders),
          totalSpent: Number(item.totalSpent),
          lastOrder: new Date(item.lastOrder),
        });
      }
    });

    // Calculate returning customers (customers who ordered in this period and also before)
    const customersInPeriod = Array.from(customerMap.keys());
    let returningCustomers = 0;

    if (customersInPeriod.length > 0) {
      // Check how many of these customers had orders before the current period
      const salesBeforePeriod = await this.saleRepository
        .createQueryBuilder('sale')
        .select('DISTINCT sale.customer.id', 'customerId')
        .where('sale.createdAt < :startDate', { startDate })
        .andWhere('sale.customer.id IN (:...customerIds)', {
          customerIds: customersInPeriod,
        })
        .getRawMany();

      const whatsappBeforePeriod = await this.whatsappOrderRepository
        .createQueryBuilder('wo')
        .select('DISTINCT wo.customer.id', 'customerId')
        .where('wo.createdAt < :startDate', { startDate })
        .andWhere('wo.customer.id IN (:...customerIds)', {
          customerIds: customersInPeriod,
        })
        .andWhere('wo.status != :status', { status: 'cancelled' })
        .getRawMany();

      const returningCustomerIds = new Set([
        ...salesBeforePeriod.map((r) => r.customerId),
        ...whatsappBeforePeriod.map((r) => r.customerId),
      ]);

      returningCustomers = returningCustomerIds.size;
    }

    // Calculate customer lifetime value (total revenue / customers with orders)
    const totalRevenue = await this.getTotalRevenue(
      startDate,
      endDate,
      filter.businessId,
    );
    const customersWithOrders = customersInPeriod.length;
    const customerLifetimeValue =
      customersWithOrders > 0 ? totalRevenue / customersWithOrders : 0;

    // Calculate return rate
    const returnRate =
      activeCustomers > 0
        ? Math.round((returningCustomers / activeCustomers) * 100 * 10) / 10
        : 0;

    // Determine status and format topCustomers
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        lastOrder: customer.lastOrder.toISOString(),
        status: customer.lastOrder >= thirtyDaysAgo ? 'Active' : 'Inactive',
      }));

    return {
      totalCustomers,
      newCustomers,
      activeCustomers,
      returningCustomers,
      returnRate,
      customerLifetimeValue: Math.round(customerLifetimeValue),
      topCustomers,
    };
  }

  /**
   * Get financial report
   */
  async getFinancialReport(
    filter: ReportFilterDto,
  ): Promise<FinancialReport> {
    const { startDate, endDate, previousStartDate, previousEndDate } =
      this.getDateRange(filter);

    // Get total revenue for current period
    const currentRevenue = await this.getTotalRevenue(
      startDate,
      endDate,
      filter.businessId,
    );

    // Get total revenue for previous period
    const previousRevenue = await this.getTotalRevenue(
      previousStartDate,
      previousEndDate,
      filter.businessId,
    );

    // Get total expenses for current period
    const currentExpenses = await this.getTotalExpenses(startDate, endDate);

    // Get total expenses for previous period
    const previousExpenses = await this.getTotalExpenses(
      previousStartDate,
      previousEndDate,
    );

    // Calculate net profit
    const currentNetProfit = currentRevenue - currentExpenses;
    const previousNetProfit = previousRevenue - previousExpenses;

    // Calculate profit margin
    const currentProfitMargin =
      currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0;
    const previousProfitMargin =
      previousRevenue > 0 ? (previousNetProfit / previousRevenue) * 100 : 0;

    // Get expense breakdown by category
    const expenseBreakdown = await this.getExpenseBreakdown(
      startDate,
      endDate,
      currentExpenses,
    );

    // Calculate percentage changes
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const expenseChange =
      previousExpenses > 0
        ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
        : 0;

    const profitChange =
      previousNetProfit !== 0
        ? ((currentNetProfit - previousNetProfit) / Math.abs(previousNetProfit)) *
          100
        : 0;

    const marginChange = currentProfitMargin - previousProfitMargin;

    // Get period label
    const periodLabel = this.getPeriodLabel(filter.dateRange || DateRange.LAST_30_DAYS);

    return {
      totalRevenue: {
        current: Math.round(currentRevenue),
        previous: Math.round(previousRevenue),
        percentageChange: Math.round(revenueChange * 10) / 10,
        label: 'Total Revenue',
        period: periodLabel,
      },
      totalExpenses: {
        current: Math.round(currentExpenses),
        previous: Math.round(previousExpenses),
        percentageChange: Math.round(expenseChange * 10) / 10,
        label: 'Total Expenses',
        period: periodLabel,
      },
      netProfit: {
        current: Math.round(currentNetProfit),
        previous: Math.round(previousNetProfit),
        percentageChange: Math.round(profitChange * 10) / 10,
        label: 'Net Profit',
        period: periodLabel,
      },
      profitMargin: {
        current: Math.round(currentProfitMargin * 10) / 10,
        previous: Math.round(previousProfitMargin * 10) / 10,
        percentageChange: Math.round(marginChange * 10) / 10,
        label: 'Profit Margin',
        period: periodLabel,
      },
      expenseBreakdown,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };
  }

  /**
   * Get total expenses for a date range
   */
  private async getTotalExpenses(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Get expense breakdown by category
   */
  private async getExpenseBreakdown(
    startDate: Date,
    endDate: Date,
    totalExpenses: number,
  ): Promise<Array<{ category: string; amount: number; percentage: number }>> {
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'amount')
      .where('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('expense.category')
      .orderBy('amount', 'DESC')
      .getRawMany();

    return expenses.map((expense) => ({
      category: expense.category,
      amount: Math.round(Number(expense.amount)),
      percentage:
        totalExpenses > 0
          ? Math.round((Number(expense.amount) / totalExpenses) * 1000) / 10
          : 0,
    }));
  }
}
