import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { WhatsAppOrder } from '../../whatsapp/entities/whatsapp-order.entity';
import { ProductReview } from './entities/product-review.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { StaffOnlyGuard } from './staff-only.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ProductReview, WhatsAppOrder]), SharedModule],
  controllers: [ReviewController],
  providers: [ReviewService, StaffOnlyGuard],
})
export class ReviewModule {}
