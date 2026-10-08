import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '../../whatsapp/entities/whatsapp-order.entity';
import { ReviewStatus } from './entities/product-review.entity';
import { ReviewService, toDisplayName } from './review.service';

const author = { phone: '255700000001', name: 'asha mwakyusa', businessId: 1 };

const deliveredOrder = (overrides = {}) => ({
  id: 10,
  orderNumber: 'ORD-10',
  businessId: 1,
  customerPhone: author.phone,
  status: OrderStatus.DELIVERED,
  deliveredAt: new Date('2026-10-01'),
  items: [
    { item: { id: 33, name: 'Huawei Fit 3', imageUrl: null } },
    { item: { id: 34, name: 'Huawei Fit 4', imageUrl: 'https://img/fit4.jpg' } },
  ],
  ...overrides,
});

const build = ({ order = deliveredOrder(), orders = [deliveredOrder()], reviews = [] as any[] } = {}) => {
  const reviewRepository = {
    find: jest.fn().mockResolvedValue(reviews),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve({ id: 1, ...value })),
  };
  const orderRepository = {
    findOne: jest.fn().mockResolvedValue(order),
    find: jest.fn().mockResolvedValue(orders),
  };
  return {
    service: new ReviewService(reviewRepository as any, orderRepository as any),
    reviewRepository,
    orderRepository,
  };
};

describe('toDisplayName', () => {
  it('shows a first name and last initial, never the full name', () => {
    expect(toDisplayName('asha mwakyusa')).toBe('Asha M.');
    expect(toDisplayName('Juma')).toBe('Juma');
    expect(toDisplayName('  ')).toBe('Verified buyer');
    expect(toDisplayName(null)).toBe('Verified buyer');
  });
});

describe('ReviewService.create', () => {
  it('saves a published review for a product in a delivered order', async () => {
    const { service, reviewRepository } = build();
    await service.create(author, { orderId: 10, itemId: 33, rating: 5, comment: '  Great watch  ' });

    expect(reviewRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 10,
        itemId: 33,
        businessId: 1,
        customerPhone: author.phone,
        displayName: 'Asha M.',
        rating: 5,
        comment: 'Great watch',
        status: ReviewStatus.PUBLISHED,
      }),
    );
  });

  it("refuses someone else's order with the same answer as a missing one", async () => {
    const other = build({ order: deliveredOrder({ customerPhone: '255700000999' }) });
    await expect(other.service.create(author, { orderId: 10, itemId: 33, rating: 5 })).rejects.toThrow(NotFoundException);

    const missing = build({ order: null as any });
    await expect(missing.service.create(author, { orderId: 10, itemId: 33, rating: 5 })).rejects.toThrow(NotFoundException);
  });

  it('refuses an order that has not been delivered', async () => {
    const { service } = build({ order: deliveredOrder({ status: OrderStatus.CONFIRMED }) });
    await expect(service.create(author, { orderId: 10, itemId: 33, rating: 5 })).rejects.toThrow(ForbiddenException);
  });

  it('refuses a product that was not in the order', async () => {
    const { service } = build();
    await expect(service.create(author, { orderId: 10, itemId: 99, rating: 5 })).rejects.toThrow(BadRequestException);
  });

  it('refuses a second review of the same product from the same order', async () => {
    const { service, reviewRepository } = build();
    reviewRepository.findOne.mockResolvedValue({ id: 7 });
    await expect(service.create(author, { orderId: 10, itemId: 33, rating: 4 })).rejects.toThrow(ConflictException);
  });

  it.each([0, 6, 4.5, '5', undefined])('refuses rating %p', async (rating) => {
    const { service, reviewRepository } = build();
    await expect(service.create(author, { orderId: 10, itemId: 33, rating: rating as any })).rejects.toThrow(BadRequestException);
    expect(reviewRepository.save).not.toHaveBeenCalled();
  });

  it('refuses an over-long comment', async () => {
    const { service } = build();
    await expect(
      service.create(author, { orderId: 10, itemId: 33, rating: 5, comment: 'x'.repeat(1001) }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('ReviewService.pendingFor', () => {
  it('lists delivered products that have not been rated yet', async () => {
    const { service } = build({ reviews: [{ orderId: 10, itemId: 33 }] });
    const pending = await service.pendingFor(author);

    expect(pending).toEqual([
      expect.objectContaining({ orderId: 10, itemId: 34, name: 'Huawei Fit 4' }),
    ]);
  });

  it('asks only for this customer\'s delivered orders', async () => {
    const { service, orderRepository } = build();
    await service.pendingFor(author);

    expect(orderRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerPhone: author.phone, businessId: 1, status: OrderStatus.DELIVERED },
      }),
    );
  });
});

describe('ReviewService.forItem', () => {
  it('summarises published reviews without exposing who wrote them', async () => {
    const { service, reviewRepository } = build({
      reviews: [
        { id: 1, rating: 5, comment: 'Great', displayName: 'Asha M.', customerPhone: '255700000001', createdAt: new Date() },
        { id: 2, rating: 4, comment: null, displayName: 'Juma', customerPhone: '255700000002', createdAt: new Date() },
      ],
    });
    const result = await service.forItem(33, 1);

    expect(reviewRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { itemId: 33, businessId: 1, status: ReviewStatus.PUBLISHED } }),
    );
    expect(result.average).toBe(4.5);
    expect(result.count).toBe(2);
    expect(result.breakdown).toEqual({ 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 });
    expect(JSON.stringify(result)).not.toContain('2557');
  });

  it('reports no average when there are no reviews', async () => {
    const { service } = build();
    expect(await service.forItem(33, 1)).toMatchObject({ average: null, count: 0, reviews: [] });
  });
});
