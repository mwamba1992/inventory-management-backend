// src/sale/sale.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { Sale } from './entities/sale.entity';
import { Customer } from '../settings/customer/entities/customer.entity';
import { Item } from '../items/item/entities/item.entity';
import { Warehouse } from '../settings/warehouse/entities/warehouse.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { WhatsAppService } from './awarness.sales';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, Customer, Item, Warehouse, ItemStock]),
    forwardRef(() => WhatsAppModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [SaleController],
  providers: [SaleService, WhatsAppService],
  exports: [SaleService], // Export SaleService for use in other modules
})
export class SaleModule {}
