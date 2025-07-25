import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehousesController } from './warehouse.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse])], // Add your entities here
  controllers: [WarehousesController],
  providers: [WarehouseService],
})
export class WarehouseModule {}
