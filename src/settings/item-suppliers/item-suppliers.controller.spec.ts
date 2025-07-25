import { Test, TestingModule } from '@nestjs/testing';
import { ItemSuppliersController } from './item-suppliers.controller';
import { ItemSuppliersService } from './item-suppliers.service';

describe('ItemSuppliersController', () => {
  let controller: ItemSuppliersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemSuppliersController],
      providers: [ItemSuppliersService],
    }).compile();

    controller = module.get<ItemSuppliersController>(ItemSuppliersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
