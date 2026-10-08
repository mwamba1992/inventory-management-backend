import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus, WhatsAppOrder } from '../../whatsapp/entities/whatsapp-order.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProductReview, ReviewStatus } from './entities/product-review.entity';

export interface ReviewAuthor {
  phone: string;
  name?: string | null;
  businessId: number;
}

/** "Asha Mwakyusa" -> "Asha M."; nothing usable -> "Verified buyer". */
export const toDisplayName = (name?: string | null): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Verified buyer';
  const first = parts[0][0].toUpperCase() + parts[0].slice(1);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
};

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ProductReview)
    private readonly reviewRepository: Repository<ProductReview>,
    @InjectRepository(WhatsAppOrder)
    private readonly orderRepository: Repository<WhatsAppOrder>,
  ) {}

  /** Published reviews of one product, with the average and the 1–5 breakdown. */
  async forItem(itemId: number, businessId: number) {
    const reviews = await this.reviewRepository.find({
      where: { itemId, businessId, status: ReviewStatus.PUBLISHED },
      order: { createdAt: 'DESC' },
    });

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const review of reviews) breakdown[review.rating]++;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);

    return {
      average: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : null,
      count: reviews.length,
      breakdown,
      // An explicit allowlist: the author's phone number stays on the server.
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        name: review.displayName,
        createdAt: review.createdAt,
      })),
    };
  }

  /** Products this customer has received and not yet rated. */
  async pendingFor(author: ReviewAuthor) {
    const orders = await this.deliveredOrders(author);
    if (orders.length === 0) return [];

    const written = await this.reviewRepository.find({
      where: { customerPhone: author.phone, businessId: author.businessId },
    });
    const done = new Set(written.map((review) => `${review.orderId}:${review.itemId}`));

    return orders.flatMap((order) =>
      order.items
        .filter((line) => line.item && !done.has(`${order.id}:${line.item.id}`))
        .map((line) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          deliveredAt: order.deliveredAt,
          itemId: line.item.id,
          name: line.item.name,
          imageUrl: line.item.imageUrl ?? null,
        })),
    );
  }

  async create(author: ReviewAuthor, dto: CreateReviewDto): Promise<ProductReview> {
    // Checked here rather than left to the DTO decorators: the app registers no
    // global ValidationPipe, so those decorators document the shape only.
    const { orderId, itemId, rating } = dto ?? ({} as CreateReviewDto);
    if (![orderId, itemId, rating].every(Number.isInteger)) {
      throw new BadRequestException('orderId, itemId and rating must be whole numbers');
    }
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    if (dto.comment != null && (typeof dto.comment !== 'string' || dto.comment.length > 1000)) {
      throw new BadRequestException('Comment must be text of at most 1000 characters');
    }

    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, businessId: author.businessId },
      relations: ['items', 'items.item'],
    });

    // The same answer whether the order is missing or someone else's, so order
    // ids cannot be probed.
    if (!order || order.customerPhone !== author.phone) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new ForbiddenException('You can rate a product once the order has been delivered');
    }
    if (!order.items.some((line) => line.item?.id === dto.itemId)) {
      throw new BadRequestException('That product is not part of this order');
    }

    const existing = await this.reviewRepository.findOne({
      where: { orderId: dto.orderId, itemId: dto.itemId },
    });
    if (existing) throw new ConflictException('You have already rated this product for this order');

    return this.reviewRepository.save(
      this.reviewRepository.create({
        itemId: dto.itemId,
        orderId: dto.orderId,
        businessId: author.businessId,
        customerPhone: author.phone,
        displayName: toDisplayName(author.name),
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        status: ReviewStatus.PUBLISHED,
      }),
    );
  }

  /** Every review, newest first, for the staff moderation screen. */
  listForStaff(businessId: number, status?: ReviewStatus): Promise<ProductReview[]> {
    return this.reviewRepository.find({
      where: { businessId, ...(status ? { status } : {}) },
      relations: ['item'],
      order: { createdAt: 'DESC' },
    });
  }

  async setStatus(id: number, businessId: number, status: ReviewStatus): Promise<ProductReview> {
    const review = await this.reviewRepository.findOne({ where: { id, businessId } });
    if (!review) throw new NotFoundException('Review not found');
    review.status = status;
    return this.reviewRepository.save(review);
  }

  private deliveredOrders(author: ReviewAuthor): Promise<WhatsAppOrder[]> {
    return this.orderRepository.find({
      where: {
        customerPhone: author.phone,
        businessId: author.businessId,
        status: OrderStatus.DELIVERED,
      },
      relations: ['items', 'items.item'],
      order: { deliveredAt: 'DESC' },
    });
  }
}
