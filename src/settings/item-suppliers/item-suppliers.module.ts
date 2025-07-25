import { Module } from '@nestjs/common';
import { ItemSuppliersService } from './item-suppliers.service';
import { ItemSuppliersController } from './item-suppliers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemSupplier } from './entities/item-supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItemSupplier])],
  controllers: [ItemSuppliersController],
  providers: [ItemSuppliersService],
})
export class ItemSuppliersModule {}
