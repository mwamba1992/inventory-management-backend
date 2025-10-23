import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppApiService } from './services/whatsapp-api.service';
import { SessionService } from './services/session.service';
import { MessageHandlerService } from './services/message-handler.service';
import { WhatsAppOrderService } from './services/whatsapp-order.service';
import { AbandonedCartService } from './services/abandoned-cart.service';
import { OrderNotificationService } from './services/order-notification.service';
import { WhatsAppOrder } from './entities/whatsapp-order.entity';
import { WhatsAppOrderItem } from './entities/whatsapp-order-item.entity';
import { WhatsAppSession } from './entities/whatsapp-session.entity';
import { ItemModule } from '../items/item/item.module';
import { CustomerModule } from '../settings/customer/customer.module';
import { WarehouseModule } from '../settings/warehouse/warehouse.module';
import { CommonModule } from '../settings/common/common.module';
import { SaleModule } from '../sale/sale.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsAppOrder,
      WhatsAppOrderItem,
      WhatsAppSession,
    ]),
    ScheduleModule.forRoot(),
    HttpModule,
    ItemModule,
    CustomerModule,
    WarehouseModule,
    CommonModule,
    SaleModule,
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppApiService,
    SessionService,
    MessageHandlerService,
    WhatsAppOrderService,
    AbandonedCartService,
    OrderNotificationService,
  ],
  exports: [
    WhatsAppApiService,
    WhatsAppOrderService,
    SessionService,
    OrderNotificationService,
  ],
})
export class WhatsAppModule {}
