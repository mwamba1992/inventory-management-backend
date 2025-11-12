import { DataSource } from 'typeorm';
import { Account } from '../../account/account/entities/account.entity';
import { Item } from '../../items/item/entities/item.entity';
import { Common } from '../../settings/common/entities/common.entity';
import { Tax } from '../../settings/tax/entities/tax.entity';
import { Business } from '../../settings/business/entities/business.entity';
import { InventoryTransaction } from '../../transaction/entities/transaction.entity';
import { Warehouse } from '../../settings/warehouse/entities/warehouse.entity';
import { ItemSupplier } from '../../settings/item-suppliers/entities/item-supplier.entity';
import { ColorCategory } from '../../settings/color-category/entities/color-category.entity';
import { ItemPrice } from '../../items/item/entities/item-price.entity';
import { ItemStock } from '../../items/item/entities/item-stock.entity';
import { ItemStockDistribution } from '../../items/item/entities/item-stock-distribution.entity';
import { ItemAccountMapping } from '../../items/item/entities/item-account-mapping.entity';
import { User } from '../../auth/user/entities/user.entity';
import { Role } from '../../auth/role/entities/role.entity';
import { Permission } from '../../auth/permission/entities/permission.entity';
import { Customer } from '../../settings/customer/entities/customer.entity';
import { Sale } from '../../sale/entities/sale.entity';
import { Expense } from '../../expense/entities/expense.entity';
import { WhatsAppOrder } from '../../whatsapp/entities/whatsapp-order.entity';
import { WhatsAppOrderItem } from '../../whatsapp/entities/whatsapp-order-item.entity';
import { WhatsAppSession } from '../../whatsapp/entities/whatsapp-session.entity';
import { seedColors } from './seed-colors';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

  // Create data source
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '84.247.178.93',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'amtz',
    password: process.env.DB_PASSWORD || 'amtz',
    database: process.env.DB_DATABASE || 'inventorydb',
    schema: process.env.DB_SCHEMA || 'core',
    entities: [
      Account,
      Item,
      Common,
      Tax,
      Business,
      InventoryTransaction,
      Warehouse,
      ItemSupplier,
      ColorCategory,
      ItemPrice,
      ItemStock,
      ItemStockDistribution,
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
    synchronize: false,
    logging: false,
  });

  try {
    // Initialize connection
    console.log('📡 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected!\n');

    // Run color seeding
    await seedColors(AppDataSource);

    console.log('\n✨ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n📡 Database connection closed.');
    }
  }
}

// Run the seeding
runSeeds()
  .then(() => {
    console.log('✅ Seeding process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
