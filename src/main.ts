import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Inventory Management System API')
    .setDescription(
      `Complete API documentation for the Inventory Management System with WhatsApp integration.

## Features
- 📦 **Inventory Management** - Products, stock, pricing, warehouses
- 💰 **Sales & Expenses** - Track sales, expenses, and revenue
- 👥 **Customer Management** - Customer records and history
- 📱 **WhatsApp Integration** - Order via WhatsApp with product images
- 📸 **Image Upload** - Cloudinary CDN integration with auto-optimization
- 📊 **Reports & Analytics** - Business insights and metrics

## Image Upload
Products support image uploads via Cloudinary CDN:
- Auto-optimization and compression
- Automatic resizing to 800x800px max
- WebP format conversion for faster loading
- Images display automatically in WhatsApp bot

## WhatsApp Bot
Customers can order products directly via WhatsApp:
- Browse products by category
- View product images and prices
- Add to cart and checkout
- Track orders in real-time
- Receive order status notifications
      `,
    )
    .setVersion('1.0')
    .setContact(
      'Support',
      'https://github.com/yourusername',
      'support@yourcompany.com',
    )
    // .addBearerAuth()           // Uncomment if using JWT auth
    .addTag('Items', 'Product/Item management and image uploads')
    .addTag('WhatsApp', 'WhatsApp bot integration and order management')
    .addTag('Sales', 'Sales transactions and analytics')
    .addTag('Customers', 'Customer management')
    .addTag('Warehouses', 'Warehouse management')
    .addTag('Reports', 'Business reports and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Export raw JSON to a file
  writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(3000);
}
bootstrap();
