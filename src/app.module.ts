import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemModule } from './items/item/item.module';
import { TransactionModule } from './transaction/transaction.module';
import { AccountModule } from './account/account/account.module';
import { CommonModule } from './settings/common/common.module';
import { TaxModule } from './settings/tax/tax.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account/account/entities/account.entity';
import { Item } from './items/item/entities/item.entity';
import { Common } from './settings/common/entities/common.entity';
import { Tax } from './settings/tax/entities/tax.entity';
import { Business } from './settings/business/entities/business.entity';
import { InventoryTransaction } from './transaction/entities/transaction.entity';
import { BusinessModule } from './settings/business/business.module';
import { Warehouse } from './settings/warehouse/entities/warehouse.entity';
import { WarehouseModule } from './settings/warehouse/warehouse.module';
import { ItemSupplier } from './settings/item-suppliers/entities/item-supplier.entity';
import { ItemSuppliersModule } from './settings/item-suppliers/item-suppliers.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user/entities/user.entity';
import { Role } from './auth/role/entities/role.entity';
import { Permission } from './auth/permission/entities/permission.entity';
import { ItemPrice } from './items/item/entities/item-price.entity';
import { ItemStock } from './items/item/entities/item-stock.entity';
import { ItemAccountMapping } from './items/item/entities/item-account-mapping.entity';
import { CustomerModule } from './settings/customer/customer.module';
import { Customer } from './settings/customer/entities/customer.entity';
import { SaleModule } from './sale/sale.module';
import { Sale } from './sale/entities/sale.entity';
import { ExpenseModule } from './expense/expense.module';
import { Expense } from './expense/entities/expense.entity';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { WhatsAppOrder } from './whatsapp/entities/whatsapp-order.entity';
import { WhatsAppOrderItem } from './whatsapp/entities/whatsapp-order-item.entity';
import { WhatsAppSession } from './whatsapp/entities/whatsapp-session.entity';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
      envFilePath: '.env',
    }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '84.247.178.93',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      password: process.env.DB_PASSWORD || 'amtz',
      username: process.env.DB_USERNAME || 'amtz',
      entities: [
        Account,
        Item,
        Common,
        Tax,
        Business,
        InventoryTransaction,
        Warehouse,
        ItemSupplier,
        ItemPrice,
        ItemStock,
        ItemAccountMapping,
        User,
        Role,
        Permission,
        Customer,
        Sale,
        Expense,
        WhatsAppOrder,
        WhatsAppOrderItem,
        WhatsAppSession,
      ],
      database: process.env.DB_DATABASE || 'inventorydb',
      schema: process.env.DB_SCHEMA || 'core',
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    ItemModule,
    TransactionModule,
    AccountModule,
    CommonModule,
    TaxModule,
    BusinessModule,
    WarehouseModule,
    ItemSuppliersModule,
    CustomerModule,
    SaleModule,
    ExpenseModule,
    WhatsAppModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
