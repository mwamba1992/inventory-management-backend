import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Sale } from '../sale/entities/sale.entity';
import { UserContextService } from '../auth/user/dto/user.context';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    private readonly userContextService: UserContextService,
  ) {}

  async update(
    id: number,
    updateExpenseDto: CreateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
    });
    if (!expense) {
      throw new Error('Expense not found');
    }
    Object.assign(expense, updateExpenseDto);
    return this.expenseRepo.save(expense);
  }
  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepo.create({
      ...createExpenseDto,
      createdBy: 'user',
      businessId: this.userContextService.getBusinessId(),
    });
    return this.expenseRepo.save(expense);
  }

  async findAll(): Promise<Expense[]> {
    return this.expenseRepo.find({
      where: { businessId: this.userContextService.getBusinessId() },
      order: { expenseDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<any> {
    return this.expenseRepo.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
    });
  }

  async delete(id: number): Promise<void> {
    const expense = await this.expenseRepo.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
    });
    if (!expense) {
      throw new Error('Expense not found');
    }
    await this.expenseRepo.delete(id);
  }
  async getRevenueExpenseBreakDown(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const businessId = this.userContextService.getBusinessId();

    const sales = await this.saleRepo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.item', 'item')
      .leftJoinAndSelect('item.prices', 'price')
      .where('sale.createdAt >= :startDate', { startDate })
      .andWhere('sale.business_id = :businessId', { businessId })
      .orderBy('sale.createdAt', 'DESC')
      .getMany();

    const totalCostOfGoods = sales.reduce((sum, sale) => {
      let activePrice: any = null;

      for (const element of sale.item.prices) {
        if (element.active) {
          activePrice = element;
          break; // stop once we find the active price
        }
      }

      if (activePrice) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        const costPerUnit =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          activePrice.purchaseAmount + activePrice.freightAmount;
        sum += sale.quantity * costPerUnit;
      }

      return sum;
    }, 0);


    console.log(totalCostOfGoods);


    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const revenueSumResult = await this.saleRepo
      .createQueryBuilder('sale')
      .select('SUM(sale.amountPaid)', 'totalRevenue')
      .where('sale.createdAt >= :startDate', { startDate })
      .andWhere('sale.business_id = :businessId', { businessId })
      .getRawOne();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const expenseSumResult = await this.expenseRepo
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'totalExpense')
      .where('expense.expenseDate >= :startDate', { startDate })
      .andWhere('expense.business_id = :businessId', { businessId })
      .getRawOne();

    const profitMargin =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((Number(revenueSumResult.totalRevenue) - Number(totalCostOfGoods)) /
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (Number(revenueSumResult.totalRevenue) || 1)) *
      100;

    console.log(
      revenueSumResult,
      expenseSumResult,
      totalCostOfGoods,
      profitMargin,
    );
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      totalRevenue: Number(revenueSumResult.totalRevenue) || 0,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      totalExpense: Number(expenseSumResult.totalExpense) || 0,
      grossProfit:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        Number(revenueSumResult.totalRevenue) - Number(totalCostOfGoods),
      profitMargin: profitMargin
    };
  }

  async getGroupExpenses(days: number = 30){
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const expenses = await this.expenseRepo
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('SUM(expense.amount)', "amount")
      .where('expense.expenseDate >= :startDate', { startDate })
      .andWhere('expense.business_id = :businessId', { businessId: this.userContextService.getBusinessId() })
      .groupBy('expense.category')
      .orderBy('SUM(expense.amount)', 'DESC')
      .getRawMany();

    return expenses.map((expense) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      category: expense.category,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      totalAmount: Number(expense.amount),
    }));
  }

  async findExpensesByDateRange(startDate?: string, endDate?: string): Promise<Expense[]> {
    let whereCondition: any = {
      businessId: this.userContextService.getBusinessId(),
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      whereCondition.expenseDate = Between(start, end);
    } else if (startDate) {
      const start = new Date(startDate);
      whereCondition.expenseDate = MoreThanOrEqual(start);
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      whereCondition.expenseDate = LessThan(end);
    }

    const expenses = await this.expenseRepo.find({
      where: whereCondition,
      order: { expenseDate: 'DESC' },
    });

    return expenses;
  }
}
