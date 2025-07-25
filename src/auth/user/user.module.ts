import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Role } from '../role/entities/role.entity';
import { User } from './entities/user.entity';
import { UserContextService } from './dto/user.context';
import { TypeOrmModule } from '@nestjs/typeorm';



@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UserController],
  providers: [UserService, UserContextService],
})
export class UserModule {}
