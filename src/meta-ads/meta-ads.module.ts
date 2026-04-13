import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MetaAdInsight } from './entities/meta-ad-insight.entity';
import { Sale } from '../sale/entities/sale.entity';
import { WhatsAppOrder } from '../whatsapp/entities/whatsapp-order.entity';
import { Item } from '../items/item/entities/item.entity';
import { ItemPrice } from '../items/item/entities/item-price.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { MetaAdsService } from './meta-ads.service';
import { MetaAdsCronService } from './meta-ads-cron.service';
import { MetaAdsController } from './meta-ads.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetaAdInsight, Sale, WhatsAppOrder, Item, ItemPrice, ItemStock]),
    HttpModule,
    SharedModule,
  ],
  controllers: [MetaAdsController],
  providers: [MetaAdsService, MetaAdsCronService],
  exports: [MetaAdsService],
})
export class MetaAdsModule {}
