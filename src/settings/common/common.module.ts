import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Common } from './entities/common.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Common])],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}
