import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashController } from './cash.controller';
import { CashService } from './cash.service';
import { PurchaseService } from './purchase.service';
import { CashMovement } from './entities/cash-movement.entity';
import { Item } from '../items/item/entities/item.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { InventoryTransaction } from '../transaction/entities/transaction.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CashMovement,
      Item,
      ItemStock,
      InventoryTransaction,
    ]),
    SharedModule,
  ],
  controllers: [CashController],
  providers: [CashService, PurchaseService],
  exports: [CashService, PurchaseService],
})
export class CashModule {}
