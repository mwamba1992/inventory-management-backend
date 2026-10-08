import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { ItemStockDistribution } from './entities/item-stock-distribution.entity';
import { CreateItemStockDistributionDto } from './dto/create-item-stock-distribution.dto';
import { UpdateItemStockDistributionDto } from './dto/update-item-stock-distribution.dto';
import { ItemAccountMapping } from './entities/item-account-mapping.entity';
import { CreateItemAccountMappingDto } from './dto/create-item-account-mapping.dto';
import { UpdateItemAccountMappingDto } from './dto/update-item-account-mapping.dto';
import { Warehouse } from '../../settings/warehouse/entities/warehouse.entity';
import { ItemSupplier } from '../../settings/item-suppliers/entities/item-supplier.entity';
import { ColorCategory } from '../../settings/color-category/entities/color-category.entity';
import { Brand } from '../../settings/brand/entities/brand.entity';
import { UserContextService } from '../../auth/user/dto/user.context';
import { StorefrontItemDto } from './dto/storefront-item.dto';
import { ItemImage } from './entities/item-image.entity';
import { ProductReview, ReviewStatus } from '../reviews/entities/product-review.entity';

/** Main photo plus this many more. Enough for every angle; few enough to load quickly. */
export const MAX_GALLERY_IMAGES = 7;

export interface ItemGallery {
  main: string | null;
  images: { id: number; url: string; position: number }[];
}

interface RatingSummary {
  average: number;
  count: number;
}

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
    @InjectRepository(ItemStockDistribution)
    private readonly itemStockDistributionRepository: Repository<ItemStockDistribution>,
    @InjectRepository(ItemAccountMapping)
    private readonly itemAccountMappingRepository: Repository<ItemAccountMapping>,
    @InjectRepository(Warehouse)
    private readonly wareHouseRepository: Repository<Warehouse>,
    @InjectRepository(ItemSupplier)
    private readonly itemSupplierRepository: Repository<ItemSupplier>,
    @InjectRepository(ColorCategory)
    private readonly colorCategoryRepository: Repository<ColorCategory>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(ItemImage)
    private readonly itemImageRepository: Repository<ItemImage>,
    @InjectRepository(ProductReview)
    private readonly reviewRepository: Repository<ProductReview>,
    private readonly userContextService: UserContextService,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    console.log(createItemDto);
    const item = new Item();
    item.name = createItemDto.name;
    item.desc = createItemDto.desc;

    // Auto-generate product code if not provided
    if (createItemDto.code) {
      item.code = createItemDto.code;
    } else {
      item.code = await this.generateNextProductCode();
    }

    if (createItemDto.categoryId) {
      item.category = await this.commonRepository.findOneByOrFail({
        id: createItemDto.categoryId,
      });
    }

    if (createItemDto.subcategoryId) {
      item.subcategory = await this.commonRepository.findOneByOrFail({
        id: createItemDto.subcategoryId,
      });
    }

    if (createItemDto.warehouseId) {
      item.warehouse = await this.wareHouseRepository.findOneByOrFail({
        id: createItemDto.warehouseId,
      });
    }

    if (createItemDto.supplierId) {
      item.supplier = await this.itemSupplierRepository.findOneByOrFail({
        id: createItemDto.supplierId,
      });
    }

    if (createItemDto.brandId) {
      item.brand = await this.brandRepository.findOneByOrFail({
        id: createItemDto.brandId,
      });
    }

    item.businessId = this.userContextService.getBusinessId();
    return this.itemRepository.save(item);
  }

  async findAll(): Promise<Item[]> {
    return this.itemRepository.find({
      where: { businessId: this.userContextService.getBusinessId() },
      relations: [
        'category',
        'subcategory',
        'warehouse',
        'supplier',
        'brand',
        'business',
        'prices',
        'stock',
        'stock.warehouse',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
      relations: [
        'category',
        'subcategory',
        'warehouse',
        'supplier',
        'brand',
        'business',
        'prices',
        'stock',
        'stock.warehouse',
      ],
    });

    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  // ========== STOREFRONT (PUBLIC, UNAUTHENTICATED) ==========

  /**
   * Items for the public storefront, mapped to a shape that carries no cost data.
   * Never widen this to return Item entities: `prices` holds purchase and margin
   * figures, and everything on these two methods is served without a token.
   */
  async findAllForStorefront(): Promise<StorefrontItemDto[]> {
    const businessId = this.userContextService.getBusinessId();
    const [items, ratings] = await Promise.all([
      this.itemRepository.find({
        where: { businessId },
        relations: ['category', 'brand', 'prices', 'stock', 'images'],
        order: { createdAt: 'DESC' },
      }),
      this.ratingSummaries(businessId),
    ]);

    return items.map((item) => this.toStorefrontItem(item, ratings.get(item.id)));
  }

  async findOneForStorefront(id: number): Promise<StorefrontItemDto> {
    const businessId = this.userContextService.getBusinessId();
    const item = await this.itemRepository.findOne({
      where: { id, businessId },
      relations: ['category', 'brand', 'prices', 'stock', 'images'],
    });

    if (!item) throw new NotFoundException('Item not found');
    const ratings = await this.ratingSummaries(businessId, id);
    return this.toStorefrontItem(item, ratings.get(item.id));
  }

  /** Average and count of published ratings per item, in one grouped query. */
  private async ratingSummaries(
    businessId: number,
    itemId?: number,
  ): Promise<Map<number, RatingSummary>> {
    const query = this.reviewRepository
      .createQueryBuilder('review')
      .select('review.itemId', 'itemId')
      .addSelect('AVG(review.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('review.businessId = :businessId', { businessId })
      .andWhere('review.status = :status', { status: ReviewStatus.PUBLISHED })
      .groupBy('review.itemId');
    if (itemId) query.andWhere('review.itemId = :itemId', { itemId });

    const rows = await query.getRawMany<{ itemId: number; average: string; count: string }>();
    return new Map(
      rows.map((row) => [
        Number(row.itemId),
        { average: Math.round(Number(row.average) * 10) / 10, count: Number(row.count) },
      ]),
    );
  }

  private toStorefrontItem(item: Item, rating?: RatingSummary): StorefrontItemDto {
    const activePrice = item.prices?.find((price) => price.isActive);
    const totalStock = (item.stock ?? []).reduce(
      (sum, stock) => sum + (stock.quantity || 0),
      0,
    );
    const gallery = [...(item.images ?? [])]
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .map((image) => image.url);

    return {
      id: item.id,
      name: item.name,
      code: item.code ?? null,
      desc: item.desc ?? null,
      imageUrl: item.imageUrl ?? null,
      images: [...new Set([item.imageUrl, ...gallery].filter(Boolean))],
      condition: item.condition,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      category: item.category
        ? {
            id: item.category.id,
            code: item.category.code,
            description: item.category.description ?? null,
          }
        : null,
      brand: item.brand ? { id: item.brand.id, name: item.brand.name } : null,
      sellingPrice: activePrice ? Number(activePrice.sellingPrice) : null,
      inStock: totalStock > 0,
      totalStock,
      ratingAverage: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
    };
  }

  // ========== PHOTO GALLERY ==========
  // `imageUrl` is the main photo; ItemImage rows are the rest. A product's
  // first photo always becomes the main one.

  private async findItemWithImages(id: number): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { id, businessId: this.userContextService.getBusinessId() },
      relations: ['images'],
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  private toGallery(item: Item): ItemGallery {
    return {
      main: item.imageUrl ?? null,
      images: [...(item.images ?? [])]
        .sort((a, b) => a.position - b.position || a.id - b.id)
        .map(({ id, url, position }) => ({ id, url, position })),
    };
  }

  async getGallery(id: number): Promise<ItemGallery> {
    return this.toGallery(await this.findItemWithImages(id));
  }

  /** Whether another photo may be added. Checked before uploading, so nothing is stored and then refused. */
  async assertGalleryHasRoom(id: number): Promise<void> {
    const item = await this.findItemWithImages(id);
    if (item.imageUrl && (item.images ?? []).length >= MAX_GALLERY_IMAGES) {
      throw new BadRequestException(
        `A product can have at most ${MAX_GALLERY_IMAGES + 1} photos. Delete one first.`,
      );
    }
  }

  async addGalleryImage(id: number, url: string): Promise<ItemGallery> {
    const item = await this.findItemWithImages(id);

    if (!item.imageUrl) {
      // update(), not save(): the item was loaded with its images, and saving
      // it would make TypeORM reconcile that relation as well.
      await this.itemRepository.update(item.id, { imageUrl: url });
      item.imageUrl = url;
      return this.toGallery(item);
    }

    const last = Math.max(-1, ...(item.images ?? []).map((image) => image.position));
    const image = await this.itemImageRepository.save(
      this.itemImageRepository.create({ itemId: item.id, url, position: last + 1 }),
    );
    item.images = [...(item.images ?? []), image];
    return this.toGallery(item);
  }

  /** Removes a gallery photo and returns its URL, so the caller can delete the stored file. */
  async removeGalleryImage(id: number, imageId: number): Promise<{ url: string; gallery: ItemGallery }> {
    const item = await this.findItemWithImages(id);
    const image = (item.images ?? []).find((candidate) => candidate.id === imageId);
    if (!image) throw new NotFoundException('Photo not found');

    await this.itemImageRepository.delete(image.id);
    item.images = item.images.filter((candidate) => candidate.id !== imageId);
    return { url: image.url, gallery: this.toGallery(item) };
  }

  /** Sets the gallery order to exactly the given ids. */
  async reorderGallery(id: number, imageIds: number[]): Promise<ItemGallery> {
    const item = await this.findItemWithImages(id);
    const images = item.images ?? [];

    const sameSet =
      Array.isArray(imageIds) &&
      imageIds.length === images.length &&
      new Set(imageIds).size === imageIds.length &&
      imageIds.every((imageId) => images.some((image) => image.id === imageId));
    if (!sameSet) {
      throw new BadRequestException('imageIds must list every gallery photo of this product exactly once');
    }

    for (const image of images) image.position = imageIds.indexOf(image.id);
    await this.itemImageRepository.save(images);
    return this.toGallery(item);
  }

  /** Swaps a gallery photo with the main one. */
  async makeMainImage(id: number, imageId: number): Promise<ItemGallery> {
    const item = await this.findItemWithImages(id);
    const image = (item.images ?? []).find((candidate) => candidate.id === imageId);
    if (!image) throw new NotFoundException('Photo not found');

    const previousMain = item.imageUrl;
    await this.itemRepository.update(item.id, { imageUrl: image.url });
    item.imageUrl = image.url;

    if (previousMain) {
      image.url = previousMain;
      await this.itemImageRepository.save(image);
    } else {
      await this.itemImageRepository.delete(image.id);
      item.images = item.images.filter((candidate) => candidate.id !== imageId);
    }
    return this.toGallery(item);
  }

  async update(id: number, updateItemDto: UpdateItemDto): Promise<Item> {
    console.log(updateItemDto);
    const businessId = this.userContextService.getBusinessId();
    const item = await this.itemRepository.findOne({
      where: { id, businessId },
    });
    if (!item) throw new Error('Item not found');

    // Handle relationship updates
    if (updateItemDto.categoryId) {
      item.category = await this.commonRepository.findOneByOrFail({
        id: updateItemDto.categoryId,
      });
    }

    if (updateItemDto.subcategoryId) {
      item.subcategory = await this.commonRepository.findOneByOrFail({
        id: updateItemDto.subcategoryId,
      });
    }

    if (updateItemDto.warehouseId) {
      item.warehouse = await this.wareHouseRepository.findOneByOrFail({
        id: updateItemDto.warehouseId,
      });
    }

    if (updateItemDto.supplierId) {
      item.supplier = await this.itemSupplierRepository.findOneByOrFail({
        id: updateItemDto.supplierId,
      });
    }

    if (updateItemDto.brandId) {
      item.brand = await this.brandRepository.findOneByOrFail({
        id: updateItemDto.brandId,
      });
    }

    // Ensure businessId stays scoped to the authenticated user's business
    item.businessId = businessId;

    // Update other scalar properties
    if (updateItemDto.name !== undefined) item.name = updateItemDto.name;
    if (updateItemDto.desc !== undefined) item.desc = updateItemDto.desc;
    if (updateItemDto.code !== undefined) item.code = updateItemDto.code;
    if (updateItemDto.imageUrl !== undefined) item.imageUrl = updateItemDto.imageUrl ?? item.imageUrl;
    if (updateItemDto.condition !== undefined) item.condition = updateItemDto.condition;

    return this.itemRepository.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.itemRepository.remove(item);
  }

  async createItemPrice(
    createItemPriceDto: CreateItemPriceDto,
  ): Promise<ItemPrice> {
    const item = await this.itemRepository.findOne({
      where: { id: createItemPriceDto.itemId, businessId: this.userContextService.getBusinessId() },
    });
    if (!item) throw new Error('Item not found');
    const itemPrice = this.itemPriceRepository.create({
      ...createItemPriceDto,
      item,
    });
    return this.itemPriceRepository.save(itemPrice);
  }

  async findAllItemPrices(): Promise<ItemPrice[]> {
    return this.itemPriceRepository.find({
      where: { item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item'],
    });
  }

  async findOneItemPrice(id: number): Promise<ItemPrice> {
    const itemPrice = await this.itemPriceRepository.findOne({
      where: { id, item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item'],
    });
    if (!itemPrice) throw new Error('ItemPrice not found');
    return itemPrice;
  }

  async updateItemPrice(
    id: number,
    updateItemPriceDto: UpdateItemPriceDto,
  ): Promise<ItemPrice> {
    const itemPrice = await this.itemPriceRepository.findOne({
      where: { id, item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item'],
    });
    if (!itemPrice) throw new Error('ItemPrice not found');
    if (updateItemPriceDto.itemId) {
      const item = await this.itemRepository.findOne({
        where: { id: updateItemPriceDto.itemId, businessId: this.userContextService.getBusinessId() },
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
      where: { id: createItemStockDto.itemId, businessId: this.userContextService.getBusinessId() },
    });
    if (!item) throw new Error('Item not found');
    const warehouse = await this.wareHouseRepository.findOne({
      where: { id: createItemStockDto.warehouseId },
    });
    if (!warehouse) throw new Error('Warehouse not found');

    const existing = await this.itemStockRepository.findOne({
      where: { item: { id: item.id }, warehouse: { id: warehouse.id } },
      relations: ['item', 'warehouse'],
    });
    if (existing) {
      throw new BadRequestException(
        `Stock for item "${item.name}" in warehouse "${warehouse.name}" already exists. Edit the existing entry instead.`,
      );
    }

    const itemStock = this.itemStockRepository.create({
      ...createItemStockDto,
      item,
      warehouse,
    });
    return this.itemStockRepository.save(itemStock);
  }

  async findAllItemStocks(): Promise<ItemStock[]> {
    return this.itemStockRepository.find({
      where: { item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item', 'warehouse', 'distributions', 'distributions.colorCategory'],
    });
  }

  async findOneItemStock(id: number): Promise<ItemStock> {
    const itemStock = await this.itemStockRepository.findOne({
      where: { id, item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item', 'warehouse', 'distributions', 'distributions.colorCategory'],
    });
    if (!itemStock) throw new Error('ItemStock not found');
    return itemStock;
  }

  async updateItemStock(
    id: number,
    updateItemStockDto: UpdateItemStockDto,
  ): Promise<ItemStock> {
    const itemStock = await this.itemStockRepository.findOne({
      where: { id, item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item'],
    });
    if (!itemStock) throw new Error('ItemStock not found');
    if (updateItemStockDto.itemId) {
      const item = await this.itemRepository.findOne({
        where: { id: updateItemStockDto.itemId, businessId: this.userContextService.getBusinessId() },
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

  /**
   * Receive in-transit stock: move `quantity` units from inTransit → quantity (on-hand).
   */
  async receiveItemStock(id: number, quantity: number): Promise<ItemStock> {
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    const itemStock = await this.itemStockRepository.findOne({
      where: { id, item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item'],
    });
    if (!itemStock) throw new Error('ItemStock not found');
    if ((itemStock.inTransit || 0) < quantity) {
      throw new Error(
        `Cannot receive ${quantity} units; only ${itemStock.inTransit || 0} in transit`,
      );
    }
    itemStock.inTransit = (itemStock.inTransit || 0) - quantity;
    itemStock.quantity = (itemStock.quantity || 0) + quantity;
    return this.itemStockRepository.save(itemStock);
  }

  async createItemStockDistribution(
    createDto: CreateItemStockDistributionDto,
  ): Promise<ItemStockDistribution> {
    const itemStock = await this.itemStockRepository.findOne({
      where: { id: createDto.itemStockId },
    });
    if (!itemStock) throw new Error('ItemStock not found');

    let colorCategory: ColorCategory | undefined = undefined;
    if (createDto.colorCategoryId) {
      const foundColorCategory = await this.colorCategoryRepository.findOne({
        where: { id: createDto.colorCategoryId },
      });
      if (!foundColorCategory) throw new Error('Color category not found');
      colorCategory = foundColorCategory;
    }

    const distribution = this.itemStockDistributionRepository.create({
      itemStock,
      colorCategory,
      quantity: createDto.quantity,
    });
    return this.itemStockDistributionRepository.save(distribution);
  }

  async findAllItemStockDistributions(): Promise<ItemStockDistribution[]> {
    return this.itemStockDistributionRepository.find({
      where: { itemStock: { item: { businessId: this.userContextService.getBusinessId() } } },
      relations: ['itemStock', 'itemStock.item', 'colorCategory'],
    });
  }

  async findOneItemStockDistribution(id: number): Promise<ItemStockDistribution> {
    const distribution = await this.itemStockDistributionRepository.findOne({
      where: { id, itemStock: { item: { businessId: this.userContextService.getBusinessId() } } },
      relations: ['itemStock', 'itemStock.item', 'colorCategory'],
    });
    if (!distribution) throw new Error('ItemStockDistribution not found');
    return distribution;
  }

  async updateItemStockDistribution(
    id: number,
    updateDto: UpdateItemStockDistributionDto,
  ): Promise<ItemStockDistribution> {
    const distribution = await this.itemStockDistributionRepository.findOne({
      where: { id, itemStock: { item: { businessId: this.userContextService.getBusinessId() } } },
      relations: ['itemStock', 'itemStock.item'],
    });
    if (!distribution) throw new Error('ItemStockDistribution not found');

    if (updateDto.itemStockId) {
      const itemStock = await this.itemStockRepository.findOne({
        where: { id: updateDto.itemStockId },
      });
      if (!itemStock) throw new Error('ItemStock not found');
      distribution.itemStock = itemStock;
    }

    if (updateDto.colorCategoryId) {
      const colorCategory = await this.colorCategoryRepository.findOne({
        where: { id: updateDto.colorCategoryId },
      });
      if (!colorCategory) throw new Error('Color category not found');
      distribution.colorCategory = colorCategory;
    }

    Object.assign(distribution, updateDto);
    return this.itemStockDistributionRepository.save(distribution);
  }

  async removeItemStockDistribution(id: number): Promise<void> {
    await this.itemStockDistributionRepository.delete(id);
  }

  async createItemAccountMapping(
    createDto: CreateItemAccountMappingDto,
  ): Promise<ItemAccountMapping> {
    const item = await this.itemRepository.findOne({
      where: { id: createDto.itemId, businessId: this.userContextService.getBusinessId() },
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
      where: { item: { businessId: this.userContextService.getBusinessId() } },
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
      where: { id, item: { businessId: this.userContextService.getBusinessId() } },
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
      where: { id, item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item'],
    });
    if (!mapping) throw new Error('ItemAccountMapping not found');
    if (updateDto.itemId) {
      const item = await this.itemRepository.findOne({
        where: { id: updateDto.itemId, businessId: this.userContextService.getBusinessId() },
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
    const items = await this.itemStockRepository.find({
      where: { item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item'],
    });
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  async itemsWithLowStocksCount(): Promise<number> {
    const lowStockItems = await this.itemStockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.item', 'item')
      .where('stock.quantity <= stock.reorderPoint')
      .andWhere('item.business_id = :businessId', { businessId: this.userContextService.getBusinessId() })
      .getMany();

    return lowStockItems.length;
  }

  async getItemsStockValue() {
    const items = await this.itemStockRepository.find({
      where: { item: { businessId: this.userContextService.getBusinessId() } },
      relations: ['item', 'item.prices'],
    });

    return items.reduce((total, item) => {
      const activePrice = item.item.prices.find((price) => price.isActive);
      const sellingPrice = activePrice ? activePrice.sellingPrice : 0;
      return total + item.quantity * sellingPrice;
    }, 0);
  }

  /**
   * Generates the next available product code in the format PROD-XXX
   * @returns Promise<string> - Next available product code (e.g., PROD-001, PROD-002)
   */
  private async generateNextProductCode(): Promise<string> {
    // Find the highest existing product code
    const lastItem = await this.itemRepository
      .createQueryBuilder('item')
      .where("item.code LIKE 'PROD-%'")
      .andWhere('item.business_id = :businessId', { businessId: this.userContextService.getBusinessId() })
      .orderBy("item.code", 'DESC')
      .getOne();

    let nextNumber = 1;

    if (lastItem && lastItem.code) {
      // Extract the number from the last code (e.g., "PROD-005" -> 5)
      const match = lastItem.code.match(/PROD-(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format as PROD-XXX with zero padding (3 digits)
    return `PROD-${nextNumber.toString().padStart(3, '0')}`;
  }
}
