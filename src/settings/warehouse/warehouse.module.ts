import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehousesController } from './warehouse.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse]), SharedModule],
  controllers: [WarehousesController],
  providers: [WarehouseService],
  exports: [WarehouseService],
})
export class WarehouseModule {}
