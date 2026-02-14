import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CatalogueService } from './catalogue/catalogue.service';
import { Sale } from '../sale/entities/sale.entity';
import { WhatsAppOrder } from '../whatsapp/entities/whatsapp-order.entity';
import { WhatsAppOrderItem } from '../whatsapp/entities/whatsapp-order-item.entity';
import { Customer } from '../settings/customer/entities/customer.entity';
import { Item } from '../items/item/entities/item.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { ItemPrice } from '../items/item/entities/item-price.entity';
import { Expense } from '../expense/entities/expense.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      WhatsAppOrder,
      WhatsAppOrderItem,
      Customer,
      Item,
      ItemStock,
      ItemPrice,
      Expense,
    ]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, CatalogueService],
  exports: [ReportsService, CatalogueService],
})
export class ReportsModule {}
