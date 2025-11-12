import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { Account } from '../../account/account/entities/account.entity';
import { ItemPrice } from './entities/item-price.entity';
import { ItemStock } from './entities/item-stock.entity';
import { ItemStockDistribution } from './entities/item-stock-distribution.entity';
import { Common } from '../../settings/common/entities/common.entity';
import { Business } from '../../settings/business/entities/business.entity';
import { ItemAccountMapping } from './entities/item-account-mapping.entity';
import { Warehouse } from '../../settings/warehouse/entities/warehouse.entity';
import { Sale } from '../../sale/entities/sale.entity';
import { ItemSupplier } from '../../settings/item-suppliers/entities/item-supplier.entity';
import { ColorCategory } from '../../settings/color-category/entities/color-category.entity';
import { CloudinaryService } from './services/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Item,
      ItemPrice,
      ItemStock,
      ItemStockDistribution,
      Account,
      Common,
      Business,
      ItemAccountMapping,
      Warehouse,
      Sale,
      ItemSupplier,
      ColorCategory
    ]),
  ],
  controllers: [ItemController],
  providers: [ItemService, CloudinaryService],
  exports: [ItemService],
})
export class ItemModule {}
