import { Module } from '@nestjs/common';
import { ItemSuppliersService } from './item-suppliers.service';
import { ItemSuppliersController } from './item-suppliers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemSupplier } from './entities/item-supplier.entity';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([ItemSupplier]), SharedModule],
  controllers: [ItemSuppliersController],
  providers: [ItemSuppliersService],
})
export class ItemSuppliersModule {}
