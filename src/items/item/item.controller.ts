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
import { CloudinaryService } from './services/cloudinary.service';

@ApiTags('Items')
@Controller('items')
export class ItemController {
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

  // ========== IMAGE UPLOAD ==========
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
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(file);

    // Update item with new image URL
    const item = await this.itemService.update(id, {
      imageUrl: uploadResult.secure_url,
    });

    return {
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.secure_url,
      item,
    };
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
    const item = await this.itemService.findOne(id);

    if (item.imageUrl) {
      // Extract public ID and delete from Cloudinary
      const publicId = this.cloudinaryService.extractPublicId(item.imageUrl);
      await this.cloudinaryService.deleteImage(publicId);

      // Remove image URL from database
      const updatedItem = await this.itemService.update(id, { imageUrl: null });

      return {
        message: 'Image deleted successfully',
        item: updatedItem,
      };
    }

    return {
      message: 'No image to delete',
      item,
    };
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

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.itemService.remove(id);
  }
}
