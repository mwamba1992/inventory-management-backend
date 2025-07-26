import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Common } from '../../settings/common/entities/common.entity';
import { Business } from '../../settings/business/entities/business.entity';
import { Account } from '../../account/account/entities/account.entity';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemPrice } from './entities/item-price.entity';
import { CreateItemPriceDto } from './dto/create-item-price.dto';
import { UpdateItemPriceDto } from './dto/update-item-price.dto';
import { ItemStock } from './entities/item-stock.entity';
import { CreateItemStockDto } from './dto/create-item-stock.dto';
import { UpdateItemStockDto } from './dto/update-item-stock.dto';
import { ItemAccountMapping } from './entities/item-account-mapping.entity';
import { CreateItemAccountMappingDto } from './dto/create-item-account-mapping.dto';
import { UpdateItemAccountMappingDto } from './dto/update-item-account-mapping.dto';
import { Warehouse } from '../../settings/warehouse/entities/warehouse.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Common)
    private readonly commonRepository: Repository<Common>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(ItemPrice)
    private readonly itemPriceRepository: Repository<ItemPrice>,
    @InjectRepository(ItemStock)
    private readonly itemStockRepository: Repository<ItemStock>,
    @InjectRepository(ItemAccountMapping)
    private readonly itemAccountMappingRepository: Repository<ItemAccountMapping>,
    @InjectRepository(Warehouse)
    private readonly wareHouseRepository: Repository<Warehouse>,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    console.log(createItemDto);
    const item = new Item();
    item.name = createItemDto.name;
    item.desc = createItemDto.desc;
    item.category = await this.commonRepository.findOneByOrFail({
      id: createItemDto.categoryId,
    });
    item.warehouse = await this.wareHouseRepository.findOneByOrFail({
      id: createItemDto.warehouseId,
    });
    item.business = await this.businessRepository.findOneByOrFail({
      id: createItemDto.businessId,
    });
    return this.itemRepository.save(item);
  }

  async findAll(): Promise<Item[]> {
    return this.itemRepository.find({
      relations: ['category', 'warehouse', 'business', 'prices', 'stock'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(id: number, updateItemDto: UpdateItemDto): Promise<Item> {
    const item = await this.findOne(id);
    return this.itemRepository.merge(item, updateItemDto);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.itemRepository.remove(item);
  }

  async createItemPrice(
    createItemPriceDto: CreateItemPriceDto,
  ): Promise<ItemPrice> {
    const item = await this.itemRepository.findOne({
      where: { id: createItemPriceDto.itemId },
    });
    if (!item) throw new Error('Item not found');
    const itemPrice = this.itemPriceRepository.create({
      ...createItemPriceDto,
      item,
    });
    return this.itemPriceRepository.save(itemPrice);
  }

  async findAllItemPrices(): Promise<ItemPrice[]> {
    return this.itemPriceRepository.find({ relations: ['item'] });
  }

  async findOneItemPrice(id: number): Promise<ItemPrice> {
    const itemPrice = await this.itemPriceRepository.findOne({
      where: { id },
      relations: ['item'],
    });
    if (!itemPrice) throw new Error('ItemPrice not found');
    return itemPrice;
  }

  async updateItemPrice(
    id: number,
    updateItemPriceDto: UpdateItemPriceDto,
  ): Promise<ItemPrice> {
    const itemPrice = await this.itemPriceRepository.findOne({ where: { id } });
    if (!itemPrice) throw new Error('ItemPrice not found');
    if (updateItemPriceDto.itemId) {
      const item = await this.itemRepository.findOne({
        where: { id: updateItemPriceDto.itemId },
      });
      if (!item) throw new Error('Item not found');
      itemPrice.item = item;
    }
    Object.assign(itemPrice, updateItemPriceDto);
    return this.itemPriceRepository.save(itemPrice);
  }

  async removeItemPrice(id: number): Promise<void> {
    await this.itemPriceRepository.delete(id);
  }

  async createItemStock(
    createItemStockDto: CreateItemStockDto,
  ): Promise<ItemStock> {
    const item = await this.itemRepository.findOne({
      where: { id: createItemStockDto.itemId },
    });
    if (!item) throw new Error('Item not found');
    const warehouse = await this.wareHouseRepository.findOne({
      where: { id: createItemStockDto.warehouseId },
    });
    if (!warehouse) throw new Error('Warehouse not found');
    const itemStock = this.itemStockRepository.create({
      ...createItemStockDto,
      item,
      warehouse,
    });
    return this.itemStockRepository.save(itemStock);
  }

  async findAllItemStocks(): Promise<ItemStock[]> {
    return this.itemStockRepository.find({ relations: ['item', 'warehouse'] });
  }

  async findOneItemStock(id: number): Promise<ItemStock> {
    const itemStock = await this.itemStockRepository.findOne({
      where: { id },
      relations: ['item', 'warehouse'],
    });
    if (!itemStock) throw new Error('ItemStock not found');
    return itemStock;
  }

  async updateItemStock(
    id: number,
    updateItemStockDto: UpdateItemStockDto,
  ): Promise<ItemStock> {
    const itemStock = await this.itemStockRepository.findOne({ where: { id } });
    if (!itemStock) throw new Error('ItemStock not found');
    if (updateItemStockDto.itemId) {
      const item = await this.itemRepository.findOne({
        where: { id: updateItemStockDto.itemId },
      });
      if (!item) throw new Error('Item not found');
      itemStock.item = item;
    }
    if (updateItemStockDto.warehouseId) {
      const warehouse = await this.wareHouseRepository.findOne({
        where: { id: updateItemStockDto.warehouseId },
      });
      if (!warehouse) throw new Error('Warehouse not found');
      itemStock.warehouse = warehouse;
    }
    Object.assign(itemStock, updateItemStockDto);
    return this.itemStockRepository.save(itemStock);
  }

  async removeItemStock(id: number): Promise<void> {
    await this.itemStockRepository.delete(id);
  }

  async createItemAccountMapping(
    createDto: CreateItemAccountMappingDto,
  ): Promise<ItemAccountMapping> {
    const item = await this.itemRepository.findOne({
      where: { id: createDto.itemId },
    });
    if (!item) throw new Error('Item not found');
    const saleAccount = await this.accountRepository.findOne({
      where: { id: createDto.saleAccountId },
    });
    if (!saleAccount) throw new Error('Sale account not found');
    const inventoryAccount = await this.accountRepository.findOne({
      where: { id: createDto.inventoryAccountId },
    });
    if (!inventoryAccount) throw new Error('Inventory account not found');
    const cogsAccount = await this.accountRepository.findOne({
      where: { id: createDto.cogsAccountId },
    });
    if (!cogsAccount) throw new Error('COGS account not found');
    const mapping = this.itemAccountMappingRepository.create({
      item,
      saleAccount,
      inventoryAccount,
      costOfGoodsAccount: cogsAccount,
    });
    return this.itemAccountMappingRepository.save(mapping);
  }

  async findAllItemAccountMappings(): Promise<ItemAccountMapping[]> {
    return this.itemAccountMappingRepository.find({
      relations: [
        'item',
        'saleAccount',
        'inventoryAccount',
        'costOfGoodsAccount',
      ],
    });
  }

  async findOneItemAccountMapping(id: number): Promise<ItemAccountMapping> {
    const mapping = await this.itemAccountMappingRepository.findOne({
      where: { id },
      relations: [
        'item',
        'saleAccount',
        'inventoryAccount',
        'costOfGoodsAccount',
      ],
    });
    if (!mapping) throw new Error('ItemAccountMapping not found');
    return mapping;
  }

  async updateItemAccountMapping(
    id: number,
    updateDto: UpdateItemAccountMappingDto,
  ): Promise<ItemAccountMapping> {
    const mapping = await this.itemAccountMappingRepository.findOne({
      where: { id },
    });
    if (!mapping) throw new Error('ItemAccountMapping not found');
    if (updateDto.itemId) {
      const item = await this.itemRepository.findOne({
        where: { id: updateDto.itemId },
      });
      if (!item) throw new Error('Item not found');
      mapping.item = item;
    }
    if (updateDto.saleAccountId) {
      const saleAccount = await this.accountRepository.findOne({
        where: { id: updateDto.saleAccountId },
      });
      if (!saleAccount) throw new Error('Sale account not found');
      mapping.saleAccount = saleAccount;
    }
    if (updateDto.inventoryAccountId) {
      const inventoryAccount = await this.accountRepository.findOne({
        where: { id: updateDto.inventoryAccountId },
      });
      if (!inventoryAccount) throw new Error('Inventory account not found');
      mapping.inventoryAccount = inventoryAccount;
    }
    if (updateDto.cogsAccountId) {
      const cogsAccount = await this.accountRepository.findOne({
        where: { id: updateDto.cogsAccountId },
      });
      if (!cogsAccount) throw new Error('COGS account not found');
      mapping.costOfGoodsAccount = cogsAccount;
    }
    Object.assign(mapping, updateDto);
    return this.itemAccountMappingRepository.save(mapping);
  }

  async removeItemAccountMapping(id: number): Promise<void> {
    await this.itemAccountMappingRepository.delete(id);
  }

  async getTotalNumberOfItemsInStock(): Promise<number> {
    const items = await this.itemStockRepository.find();
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  async itemsWithLowStocksCount(): Promise<number> {
    const lowStockItems = await this.itemStockRepository
      .createQueryBuilder('stock')
      .where('stock.quantity <= stock.reorderPoint')
      .getMany();

    return lowStockItems.length;
  }

  async getItemsStockValue() {
    const items = await this.itemStockRepository.find({
      relations: ['item', 'item.prices'],
    });

    return items.reduce((total, item) => {
      const activePrice = item.item.prices.find((price) => price.isActive);
      const sellingPrice = activePrice ? activePrice.sellingPrice : 0;
      return total + item.quantity * sellingPrice;
    }, 0);
  }
}
