import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Sale } from '../sale/entities/sale.entity';
import { WhatsAppOrder } from '../whatsapp/entities/whatsapp-order.entity';
import { WhatsAppOrderItem } from '../whatsapp/entities/whatsapp-order-item.entity';
import { Customer } from '../settings/customer/entities/customer.entity';
import { Item } from '../items/item/entities/item.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
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
    ]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
