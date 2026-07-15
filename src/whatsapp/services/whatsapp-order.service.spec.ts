import { WhatsAppOrderService } from './whatsapp-order.service';
import { OrderStatus } from '../entities/whatsapp-order.entity';
import { SaleStatus } from '../../sale/entities/sale.entity';

describe('WhatsAppOrderService', () => {
  let service: WhatsAppOrderService;
  let orderRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    count: jest.Mock;
  };
  let orderItemRepository: { create: jest.Mock };
  let itemService: { findOne: jest.Mock; updateItemStock: jest.Mock };
  let customerService: { findAll: jest.Mock; create: jest.Mock; update: jest.Mock };
  let warehouseService: { findOne: jest.Mock };
  let saleService: { create: jest.Mock };
  let orderNotificationService: { sendStatusNotification: jest.Mock };

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
      save: jest.fn((order) => Promise.resolve(order)),
      create: jest.fn((order) => order),
      count: jest.fn().mockResolvedValue(0),
    };
    orderItemRepository = {
      create: jest.fn((orderItem) => orderItem),
    };
    itemService = {
      findOne: jest.fn(),
      updateItemStock: jest.fn(),
    };
    customerService = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn((c) => Promise.resolve({ id: 99, ...c })),
      update: jest.fn(),
    };
    warehouseService = {
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Main' }),
    };
    saleService = {
      create: jest.fn(),
    };
    orderNotificationService = {
      sendStatusNotification: jest.fn().mockResolvedValue(false),
    };

    service = new WhatsAppOrderService(
      orderRepository as any,
      orderItemRepository as any,
      itemService as any,
      customerService as any,
      warehouseService as any,
      saleService as any,
      { sendTextMessage: jest.fn() } as any,
      orderNotificationService as any,
      { getBusinessId: jest.fn().mockReturnValue(1) } as any,
    );
  });

  describe('createEcommerceOrder pricing', () => {
    // The storefront cart lives in localStorage, so anything price-shaped in the
    // request body is attacker-controlled. These tests exist to fail loudly if a
    // unitPrice from the client is ever trusted again.
    const baseDto = {
      customerName: 'Asha',
      customerPhone: '255712345678',
      warehouseId: 1,
      deliveryAddress: 'Kinondoni',
      items: [{ itemId: 5, quantity: 2 }],
    };

    const pricedItem = (sellingPrice: number, prices?: any[]) => ({
      id: 5,
      name: 'Samsung Watch',
      prices: prices ?? [{ sellingPrice, isActive: true }],
      stock: [{ id: 7, quantity: 5, warehouse: { id: 1 } }],
    });

    it('charges the catalogue price, ignoring a unitPrice sent by the client', async () => {
      itemService.findOne.mockResolvedValue(pricedItem(750000));

      const order = await service.createEcommerceOrder({
        ...baseDto,
        // A tampered cart: the buyer claims this watch costs 1 shilling.
        items: [{ itemId: 5, quantity: 2, unitPrice: 1 }],
      } as any);

      expect(order.totalAmount).toBe(1500000);
      expect(order.items[0].unitPrice).toBe(750000);
      expect(order.items[0].totalPrice).toBe(1500000);
    });

    it('uses only the active price when several exist', async () => {
      itemService.findOne.mockResolvedValue(
        pricedItem(0, [
          { sellingPrice: 500000, isActive: false },
          { sellingPrice: 750000, isActive: true },
        ]),
      );

      const order = await service.createEcommerceOrder({
        ...baseDto,
        items: [{ itemId: 5, quantity: 1 }],
      } as any);

      expect(order.items[0].unitPrice).toBe(750000);
    });

    it('refuses to sell an item that has no active price', async () => {
      itemService.findOne.mockResolvedValue(
        pricedItem(0, [{ sellingPrice: 500000, isActive: false }]),
      );

      await expect(
        service.createEcommerceOrder({
          ...baseDto,
          // Even with a plausible price supplied, no active price means no sale.
          items: [{ itemId: 5, quantity: 1, unitPrice: 500000 }],
        } as any),
      ).rejects.toThrow('no active price');

      expect(orderRepository.save).not.toHaveBeenCalled();
    });
  });

  it('deducts stock once when a WhatsApp order is delivered', async () => {
    orderRepository.findOne.mockResolvedValue({
      id: 10,
      orderNumber: 'WA2605110001',
      businessId: 1,
      customerPhone: '255712345678',
      status: OrderStatus.CONFIRMED,
      warehouse: { id: 1, name: 'Main' },
      items: [
        {
          item: { id: 5 },
          quantity: 2,
          totalPrice: 200000,
        },
      ],
    });
    customerService.findAll.mockResolvedValue([
      { id: 3, phone: '255712345678' },
    ]);
    itemService.findOne.mockResolvedValue({
      id: 5,
      name: 'Samsung Watch',
      stock: [
        {
          id: 7,
          quantity: 5,
          warehouse: { id: 1 },
        },
      ],
    });

    await service.updateOrderStatus(10, OrderStatus.DELIVERED);

    expect(itemService.updateItemStock).toHaveBeenCalledTimes(1);
    expect(itemService.updateItemStock).toHaveBeenCalledWith(7, {
      quantity: 3,
    });
    expect(saleService.create).toHaveBeenCalledTimes(1);
    expect(saleService.create).toHaveBeenCalledWith(
      {
        customerId: 3,
        itemId: 5,
        warehouseId: 1,
        quantity: 2,
        amountPaid: 200000,
        remarks: 'WhatsApp Order #WA2605110001',
      },
      {
        deductStock: false,
        status: SaleStatus.DELIVERED,
      },
    );
  });
});
