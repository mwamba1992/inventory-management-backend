import { Test, TestingModule } from '@nestjs/testing';
import { ItemSuppliersService } from './item-suppliers.service';

describe('ItemSuppliersService', () => {
  let service: ItemSuppliersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemSuppliersService],
    }).compile();

    service = module.get<ItemSuppliersService>(ItemSuppliersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
