import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { Sale } from '../sale/entities/sale.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Sale])],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}
