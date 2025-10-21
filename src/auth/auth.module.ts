import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PermissionModule } from './permission/permission.module';
import { RoleModule } from './role/role.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { Constants } from '../utils/constants';
import { User } from './user/entities/user.entity';
import { UserService } from './user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService } from './role/role.service';
import { Role } from './role/entities/role.entity';
import { PermissionService } from './permission/permission.service';
import { Permission } from './permission/entities/permission.entity';
import { UserContextService } from './user/dto/user.context';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserService,
      User,
      RoleService,
      Role,
      PermissionService,
      Permission,
    ]),
    JwtModule.register({
      global: true,
      secret: Constants.JWT_SECRET, // Normal JWT secret
      signOptions: { expiresIn: '60s' }, // Normal token expiration (1 minute)
    }),
    JwtModule.register({
      global: true,
      secret: Constants.JWT_REFRESH_TOKEN, // Refresh JWT secret
      signOptions: { expiresIn: '7d' }, // Refresh token expiration (7 days)
    }),
    UserModule,
    PermissionModule,
    RoleModule,
    User,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, UserContextService],
  exports: [UserContextService],
})
export class AuthModule {}
