import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Inventory System API')
    .setDescription('API documentation for the inventory and accounting system')
    .setVersion('1.0')
    // .addBearerAuth()           // if you use JWT auth
    // .addTag('accounts')        // optional root-level tags
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
