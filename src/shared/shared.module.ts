import { Module } from '@nestjs/common';
import { UserContextService } from '../auth/user/dto/user.context';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../settings/business/entities/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Business])],
  providers: [UserContextService],
  exports: [UserContextService, TypeOrmModule],
})
export class SharedModule {}
