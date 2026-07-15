import { WhatsAppOrderService } from './whatsapp-order.service';
import { OrderStatus } from '../entities/whatsapp-order.entity';
import { SaleStatus } from '../../sale/entities/sale.entity';

describe('WhatsAppOrderService', () => {
  let service: WhatsAppOrderService;
  let orderRepository: { findOne: jest.Mock; save: jest.Mock };
  let itemService: { findOne: jest.Mock; updateItemStock: jest.Mock };
  let customerService: { findAll: jest.Mock };
  let saleService: { create: jest.Mock };
  let orderNotificationService: { sendStatusNotification: jest.Mock };

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
      save: jest.fn((order) => Promise.resolve(order)),
    };
    itemService = {
      findOne: jest.fn(),
      updateItemStock: jest.fn(),
    };
    customerService = {
      findAll: jest.fn(),
    };
    saleService = {
      create: jest.fn(),
    };
    orderNotificationService = {
      sendStatusNotification: jest.fn().mockResolvedValue(false),
    };

    service = new WhatsAppOrderService(
      orderRepository as any,
      {} as any,
      itemService as any,
      customerService as any,
      {} as any,
      saleService as any,
      { sendTextMessage: jest.fn() } as any,
      orderNotificationService as any,
      { getBusinessId: jest.fn().mockReturnValue(1) } as any,
    );
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
