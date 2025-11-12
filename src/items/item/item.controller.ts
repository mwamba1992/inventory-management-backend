import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { CreateItemPriceDto } from './dto/create-item-price.dto';
import { UpdateItemPriceDto } from './dto/update-item-price.dto';
import { ItemPrice } from './entities/item-price.entity';
import { CreateItemStockDto } from './dto/create-item-stock.dto';
import { UpdateItemStockDto } from './dto/update-item-stock.dto';
import { ItemStock } from './entities/item-stock.entity';
import { CreateItemAccountMappingDto } from './dto/create-item-account-mapping.dto';
import { UpdateItemAccountMappingDto } from './dto/update-item-account-mapping.dto';
import { ItemAccountMapping } from './entities/item-account-mapping.entity';
import { CreateItemStockDistributionDto } from './dto/create-item-stock-distribution.dto';
import { UpdateItemStockDistributionDto } from './dto/update-item-stock-distribution.dto';
import { ItemStockDistribution } from './entities/item-stock-distribution.entity';
import { CloudinaryService } from './services/cloudinary.service';

@ApiTags('Items')
@Controller('items')
export class ItemController {
  private readonly logger = new Logger(ItemController.name);

  constructor(
    private readonly itemService: ItemService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ========== ITEM CRUD ==========
  @Post()
  create(@Body() createItemDto: CreateItemDto): Promise<Item> {
    return this.itemService.create(createItemDto);
  }

  @Get()
  findAll(): Promise<Item[]> {
    return this.itemService.findAll();
  }

  // ========== ITEM STOCK CRUD ==========
  @Post('item-stocks')
  async createItemStock(
    @Body() createItemStockDto: CreateItemStockDto,
  ): Promise<ItemStock> {
    return this.itemService.createItemStock(createItemStockDto);
  }

  @Get('item-stocks')
  async findAllItemStocks(): Promise<ItemStock[]> {
    return this.itemService.findAllItemStocks();
  }

  @Get('item-stocks/available')
  async findAvailableItemStocks(): Promise<number> {
    return this.itemService.getTotalNumberOfItemsInStock();
  }

  @Get('item-stocks/low-stock')
  async findLowStockItemStocks(): Promise<number> {
    return this.itemService.itemsWithLowStocksCount();
  }

  @Get('item-stocks/actual-value')
  async findTotalItemStocks(): Promise<number> {
    return this.itemService.getItemsStockValue();
  }

  @Get('item-stocks/:id')
  async findOneItemStock(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemStock> {
    return this.itemService.findOneItemStock(id);
  }

  @Put('item-stocks/:id')
  async updateItemStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemStockDto: UpdateItemStockDto,
  ): Promise<ItemStock> {
    return this.itemService.updateItemStock(id, updateItemStockDto);
  }

  @Delete('item-stocks/:id')
  async removeItemStock(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.itemService.removeItemStock(id);
  }

  // ========== ITEM STOCK DISTRIBUTION CRUD (Color Management) ==========
  @Post('item-stock-distributions')
  @ApiOperation({
    summary: 'Create item stock distribution (Add color to stock)',
    description: 'Create a color distribution for an item stock. Use this to track how many units of each color are in a specific warehouse stock.'
  })
  async createItemStockDistribution(
    @Body() createDto: CreateItemStockDistributionDto,
  ): Promise<ItemStockDistribution> {
    return this.itemService.createItemStockDistribution(createDto);
  }

  @Get('item-stock-distributions')
  @ApiOperation({
    summary: 'Get all item stock distributions',
    description: 'Retrieve all color distributions across all item stocks.'
  })
  async findAllItemStockDistributions(): Promise<ItemStockDistribution[]> {
    return this.itemService.findAllItemStockDistributions();
  }

  @Get('item-stock-distributions/:id')
  @ApiOperation({
    summary: 'Get single item stock distribution',
    description: 'Retrieve a specific color distribution by ID.'
  })
  async findOneItemStockDistribution(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemStockDistribution> {
    return this.itemService.findOneItemStockDistribution(id);
  }

  @Put('item-stock-distributions/:id')
  @ApiOperation({
    summary: 'Update item stock distribution',
    description: 'Update a color distribution (e.g., adjust quantity for a specific color).'
  })
  async updateItemStockDistribution(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateItemStockDistributionDto,
  ): Promise<ItemStockDistribution> {
    return this.itemService.updateItemStockDistribution(id, updateDto);
  }

  @Delete('item-stock-distributions/:id')
  @ApiOperation({
    summary: 'Delete item stock distribution',
    description: 'Remove a color distribution from an item stock.'
  })
  async removeItemStockDistribution(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.itemService.removeItemStockDistribution(id);
  }

  // ========== ITEM ACCOUNT MAPPING CRUD ==========
  @Post('account-mappings')
  async createItemAccountMapping(
    @Body() createItemAccountMappingDto: CreateItemAccountMappingDto,
  ): Promise<ItemAccountMapping> {
    return this.itemService.createItemAccountMapping(
      createItemAccountMappingDto,
    );
  }

  @Get('account-mappings')
  async findAllItemAccountMappings(): Promise<ItemAccountMapping[]> {
    return this.itemService.findAllItemAccountMappings();
  }

  @Get('account-mappings/:id')
  async findOneItemAccountMapping(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemAccountMapping> {
    return this.itemService.findOneItemAccountMapping(id);
  }

  @Put('account-mappings/:id')
  async updateItemAccountMapping(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemAccountMappingDto: UpdateItemAccountMappingDto,
  ): Promise<ItemAccountMapping> {
    return this.itemService.updateItemAccountMapping(
      id,
      updateItemAccountMappingDto,
    );
  }

  @Delete('account-mappings/:id')
  async removeItemAccountMapping(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.itemService.removeItemAccountMapping(id);
  }

  // ========== ITEM PRICE CRUD ==========
  @Post('item-prices')
  async createItemPrice(
    @Body() createItemPriceDto: CreateItemPriceDto,
  ): Promise<ItemPrice> {
    return this.itemService.createItemPrice(createItemPriceDto);
  }

  @Get('item-prices')
  async findAllItemPrices(): Promise<ItemPrice[]> {
    return this.itemService.findAllItemPrices();
  }

  @Get('item-prices/:id')
  async findOneItemPrice(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemPrice> {
    return this.itemService.findOneItemPrice(id);
  }

  @Put('item-prices/:id')
  async updateItemPrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemPriceDto: UpdateItemPriceDto,
  ): Promise<ItemPrice> {
    return this.itemService.updateItemPrice(id, updateItemPriceDto);
  }

  @Delete('item-prices/:id')
  async removeItemPrice(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.itemService.removeItemPrice(id);
  }

  // ========== IMAGE UPLOAD (must be before generic :id routes) ==========
  @Post(':id/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload product image to Cloudinary',
    description:
      'Upload an image for a product. Image is automatically optimized, resized to 800x800px max, and stored in Cloudinary CDN. Supported formats: JPEG, PNG, WebP. Max size: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product image file',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, or WebP, max 5MB)',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Product/Item ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Image uploaded successfully' },
        imageUrl: {
          type: 'string',
          example:
            'https://res.cloudinary.com/demo/image/upload/v1234567890/inventory/products/abc123.jpg',
        },
        item: { type: 'object', description: 'Updated item object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file type or size',
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async uploadItemImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string; imageUrl: string; item: Item }> {
    this.logger.log(`Starting image upload for item ID: ${id}`);

    if (!file) {
      this.logger.error('No file provided in request');
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Received file: ${file.originalname} (${file.mimetype}, ${(file.size / 1024).toFixed(2)} KB)`);

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      this.logger.error(`Invalid file type: ${file.mimetype}`);
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.logger.error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      throw new BadRequestException('File size must be less than 5MB');
    }

    this.logger.log('File validation passed, uploading to Cloudinary...');

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(file);

    this.logger.log(`Cloudinary upload successful: ${uploadResult.secure_url}`);

    // Update item with new image URL
    const item = await this.itemService.update(id, {
      imageUrl: uploadResult.secure_url,
    });

    this.logger.log(`Database updated for item ID ${id} with image URL`);

    return {
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.secure_url,
      item,
    };
  }

  @Put(':id/image')
  @ApiOperation({
    summary: 'Update product image URL',
    description:
      'Manually set or update the product image URL. Use this if you have an image URL from an external source instead of uploading directly.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Product/Item ID',
    example: 1,
  })
  @ApiBody({
    description: 'Image URL',
    schema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          example: 'https://example.com/product-image.jpg',
          description: 'Full URL to the product image',
        },
      },
      required: ['imageUrl'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image URL updated successfully',
    type: Item,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  updateItemImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { imageUrl: string },
  ): Promise<Item> {
    return this.itemService.update(id, { imageUrl: body.imageUrl });
  }

  @Delete(':id/delete-image')
  @ApiOperation({
    summary: 'Delete product image from Cloudinary',
    description:
      'Deletes the product image from Cloudinary CDN and removes the imageUrl from the database.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Product/Item ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Image deleted successfully' },
        item: { type: 'object', description: 'Updated item object' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async deleteItemImage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; item: Item }> {
    this.logger.log(`Deleting image for item ID: ${id}`);

    const item = await this.itemService.findOne(id);

    if (item.imageUrl) {
      this.logger.log(`Found image URL: ${item.imageUrl}`);

      // Extract public ID and delete from Cloudinary
      const publicId = this.cloudinaryService.extractPublicId(item.imageUrl);
      this.logger.log(`Deleting from Cloudinary with public ID: ${publicId}`);

      await this.cloudinaryService.deleteImage(publicId);
      this.logger.log('Image deleted from Cloudinary successfully');

      // Remove image URL from database
      const updatedItem = await this.itemService.update(id, { imageUrl: null });
      this.logger.log(`Database updated - image URL removed for item ID ${id}`);

      return {
        message: 'Image deleted successfully',
        item: updatedItem,
      };
    }

    this.logger.log(`No image found for item ID ${id}`);
    return {
      message: 'No image to delete',
      item,
    };
  }

  // ========== GENERIC :id ROUTES (must be last) ==========
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Item> {
    return this.itemService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<Item> {
    return this.itemService.update(id, updateItemDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.itemService.remove(id);
  }
}
