import { ApiProperty } from '@nestjs/swagger';
import { ItemCondition } from '../entities/item.entity';

/**
 * Public-facing shape of an item, served to the unauthenticated storefront.
 *
 * This is an explicit allowlist, not a filtered entity: cost-side figures
 * (purchaseAmount, freightAmount, profitMargin) must never reach the browser,
 * so the storefront is given only the retail price plus a stock summary.
 * Add fields here deliberately.
 */
export class StorefrontCategoryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'WATCHES' })
  code: string;

  @ApiProperty({ example: 'Smart watches and wearables', nullable: true })
  description: string | null;
}

export class StorefrontBrandDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'HUAWEI' })
  name: string;
}

export class StorefrontItemDto {
  @ApiProperty({ example: 33 })
  id: number;

  @ApiProperty({ example: 'HUAWEI FIT 3 NEW' })
  name: string;

  @ApiProperty({ example: 'PROD-033', nullable: true })
  code: string | null;

  @ApiProperty({ example: 'Huawei Fit 3 smart watch', nullable: true })
  desc: string | null;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ enum: ItemCondition, example: ItemCondition.NEW })
  condition: ItemCondition;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: StorefrontCategoryDto, nullable: true })
  category: StorefrontCategoryDto | null;

  @ApiProperty({ type: StorefrontBrandDto, nullable: true })
  brand: StorefrontBrandDto | null;

  @ApiProperty({
    description: 'Active retail price. Null when no active price is configured.',
    example: 350000,
    nullable: true,
  })
  sellingPrice: number | null;

  @ApiProperty({ example: true })
  inStock: boolean;

  @ApiProperty({ description: 'Units on hand across all warehouses', example: 12 })
  totalStock: number;
}
