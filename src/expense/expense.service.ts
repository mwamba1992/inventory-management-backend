import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepo.create({
      ...createExpenseDto,
      createdBy: 'user',
    });
    return this.expenseRepo.save(expense);
  }

  async findAll(): Promise<Expense[]> {
    return this.expenseRepo.find({
      order: { expenseDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<any> {
    return this.expenseRepo.findOne({
      where: { id },
    });
  }

  async delete(id: number): Promise<void> {
    await this.expenseRepo.delete(id);
  }
}
