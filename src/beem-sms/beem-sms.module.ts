import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeemSmsService } from './beem-sms.service';
import { SmsMessage } from './entities/sms-message.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([SmsMessage])],
  providers: [BeemSmsService],
  exports: [BeemSmsService],
})
export class BeemSmsModule {}
