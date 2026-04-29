import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashController } from './cash.controller';
import { CashService } from './cash.service';
import { PurchaseService } from './purchase.service';
import { CashSyncService } from './cash-sync.service';
import { CashMovement } from './entities/cash-movement.entity';
import { Item } from '../items/item/entities/item.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { InventoryTransaction } from '../transaction/entities/transaction.entity';
import { Sale } from '../sale/entities/sale.entity';
import { Expense } from '../expense/entities/expense.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CashMovement,
      Item,
      ItemStock,
      InventoryTransaction,
      Sale,
      Expense,
    ]),
    SharedModule,
  ],
  controllers: [CashController],
  providers: [CashService, PurchaseService, CashSyncService],
  exports: [CashService, PurchaseService, CashSyncService],
})
export class CashModule {}
