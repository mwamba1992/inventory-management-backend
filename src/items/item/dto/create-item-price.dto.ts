export class CreateItemPriceDto {
  itemId: number;
  purchaseAmount: number;
  freightAmount: number;
  profitMargin: number;
  sellingPrice: number;
  isActive?: boolean;
} 