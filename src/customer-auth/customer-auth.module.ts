import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { Customer } from '../settings/customer/entities/customer.entity';
import { Constants } from '../utils/constants';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    JwtModule.register({
      global: true,
      secret: Constants.JWT_SECRET,
      signOptions: { expiresIn: '30d' }, // Customer tokens last 30 days
    }),
    WhatsAppModule, // Import to access WhatsAppOrderService
  ],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService],
  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}
