import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Common } from '../../settings/common/entities/common.entity';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Common]),
    SharedModule,
  ],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
