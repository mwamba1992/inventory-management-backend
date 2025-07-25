import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { InventoryTransaction } from './entities/transaction.entity'
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTransaction])],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
