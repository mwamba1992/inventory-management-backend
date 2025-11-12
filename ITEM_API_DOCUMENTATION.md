# Item Management API Documentation

## Table of Contents
- [Data Structures](#data-structures)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)

---

## Data Structures

### Item Entity
```typescript
interface Item {
  id: number;
  name: string;
  code: string;                    // Auto-generated (PROD-001, PROD-002...)
  desc?: string;
  imageUrl?: string;
  condition: 'new' | 'used';       // Default: 'new'

  // Relationships
  category?: Category;
  warehouse?: Warehouse;
  supplier?: ItemSupplier;
  business: Business;
  prices: ItemPrice[];
  stock: ItemStock[];
  accountMappings: ItemAccountMapping[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  active: boolean;
}
```

### ItemStock Entity
```typescript
interface ItemStock {
  id: number;
  quantity: number;                // Total quantity in this warehouse
  reorderPoint?: number;

  // Relationships
  item: Item;
  warehouse: Warehouse;
  distributions: ItemStockDistribution[];  // Color distributions

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}
```

### ItemStockDistribution Entity (Color Breakdown)
```typescript
interface ItemStockDistribution {
  id: number;
  quantity: number;                // Quantity for this color

  // Relationships
  itemStock: ItemStock;
  colorCategory?: ColorCategory;   // Optional: null = no specific color

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}
```

### ColorCategory Entity
```typescript
interface ColorCategory {
  id: number;
  name: string;                    // e.g., "Black", "Blue", "Red"
  hexCode?: string;                // e.g., "#000000", "#0000FF"
  description?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}
```

### ItemPrice Entity
```typescript
interface ItemPrice {
  id: number;
  purchasePrice: number;
  freightCost: number;
  profitMargin: number;
  sellingPrice: number;
  isActive: boolean;
  effectiveDate: Date;

  // Relationships
  item: Item;
  purchaseAccount: Account;
  freightAccount: Account;
  saleAccount: Account;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

---

## API Endpoints

### Base URL
```
http://localhost:3000
```

---

## Items API

### 1. Create Item
**POST** `/items`

**Request Body:**
```json
{
  "name": "T-Shirt",
  "code": "PROD-001",              // Optional: auto-generated if omitted
  "desc": "Cotton T-Shirt",
  "imageUrl": "https://...",       // Optional
  "condition": "new",              // Optional: default "new"
  "categoryId": 1,                 // Optional
  "warehouseId": 1,                // Optional
  "supplierId": 1,                 // Optional
  "businessId": 1,                 // Required
  "purchaseAmountId": 1,           // Required
  "freightAmountId": 1,            // Required
  "profitMargin": 0.25,            // Required
  "sellingPriceId": 1,             // Required
  "stockQuantity": 100,            // Required
  "saleAccountId": 1,              // Required
  "inventoryAccountId": 1,         // Required
  "costOfGoodsAccountId": 1        // Required
}
```

**Response:**
```json
{
  "id": 1,
  "name": "T-Shirt",
  "code": "PROD-001",
  "desc": "Cotton T-Shirt",
  "imageUrl": null,
  "condition": "new",
  "createdAt": "2025-01-12T10:00:00Z",
  "updatedAt": "2025-01-12T10:00:00Z",
  "active": true
}
```

---

### 2. Get All Items
**GET** `/items`

**Response:**
```json
[
  {
    "id": 1,
    "name": "T-Shirt",
    "code": "PROD-001",
    "desc": "Cotton T-Shirt",
    "imageUrl": "https://...",
    "condition": "new",
    "category": {
      "id": 1,
      "code": "APPAREL",
      "description": "Clothing"
    },
    "warehouse": {
      "id": 1,
      "name": "Main Warehouse"
    },
    "supplier": {
      "id": 1,
      "name": "ABC Supplier"
    },
    "prices": [
      {
        "id": 1,
        "purchasePrice": 10.00,
        "sellingPrice": 15.00,
        "isActive": true
      }
    ],
    "stock": [
      {
        "id": 1,
        "quantity": 100,
        "warehouse": {...},
        "distributions": [
          {
            "id": 1,
            "quantity": 40,
            "colorCategory": {
              "id": 1,
              "name": "Black",
              "hexCode": "#000000"
            }
          },
          {
            "id": 2,
            "quantity": 60,
            "colorCategory": {
              "id": 2,
              "name": "Blue",
              "hexCode": "#0000FF"
            }
          }
        ]
      }
    ],
    "createdAt": "2025-01-12T10:00:00Z",
    "updatedAt": "2025-01-12T10:00:00Z"
  }
]
```

---

### 3. Get Single Item
**GET** `/items/:id`

**Response:** Same as single item in "Get All Items"

---

### 4. Update Item
**PUT** `/items/:id`

**Request Body:** (All fields optional)
```json
{
  "name": "Updated T-Shirt",
  "desc": "Premium Cotton T-Shirt",
  "imageUrl": "https://new-image.com/image.jpg"
}
```

**Response:** Updated item object

---

### 5. Delete Item
**DELETE** `/items/:id`

**Response:** `204 No Content`

---

### 6. Upload Item Image
**POST** `/items/:id/upload-image`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
image: [File] (JPEG, PNG, WebP, max 5MB)
```

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/v123/inventory/products/abc123.jpg",
  "item": {
    "id": 1,
    "name": "T-Shirt",
    "imageUrl": "https://res.cloudinary.com/..."
  }
}
```

---

### 7. Delete Item Image
**DELETE** `/items/:id/delete-image`

**Response:**
```json
{
  "message": "Image deleted successfully",
  "item": {
    "id": 1,
    "imageUrl": null
  }
}
```

---

## ItemStock API

### 8. Create Item Stock
**POST** `/items/item-stocks`

**Request Body:**
```json
{
  "itemId": 1,
  "warehouseId": 1,
  "quantity": 100              // Total quantity
}
```

**Response:**
```json
{
  "id": 1,
  "quantity": 100,
  "reorderPoint": null,
  "item": {...},
  "warehouse": {...},
  "distributions": [],
  "createdAt": "2025-01-12T10:00:00Z"
}
```

---

### 9. Get All Item Stocks
**GET** `/items/item-stocks`

**Response:**
```json
[
  {
    "id": 1,
    "quantity": 100,
    "reorderPoint": 20,
    "item": {
      "id": 1,
      "name": "T-Shirt",
      "code": "PROD-001"
    },
    "warehouse": {
      "id": 1,
      "name": "Main Warehouse"
    },
    "distributions": [
      {
        "id": 1,
        "quantity": 40,
        "colorCategory": {
          "id": 1,
          "name": "Black",
          "hexCode": "#000000"
        }
      },
      {
        "id": 2,
        "quantity": 60,
        "colorCategory": {
          "id": 2,
          "name": "Blue",
          "hexCode": "#0000FF"
        }
      }
    ]
  }
]
```

---

### 10. Get Single Item Stock
**GET** `/items/item-stocks/:id`

**Response:** Same as single stock in "Get All Item Stocks"

---

### 11. Update Item Stock
**PUT** `/items/item-stocks/:id`

**Request Body:**
```json
{
  "quantity": 150,
  "reorderPoint": 25
}
```

**Response:** Updated item stock object

---

### 12. Delete Item Stock
**DELETE** `/items/item-stocks/:id`

**Response:** `204 No Content`

---

### 13. Get Total Stock Count
**GET** `/items/item-stocks/available`

**Response:**
```json
1500
```

---

### 14. Get Low Stock Count
**GET** `/items/item-stocks/low-stock`

**Response:**
```json
5
```

---

### 15. Get Total Stock Value
**GET** `/items/item-stocks/actual-value`

**Response:**
```json
45000.50
```

---

## ItemStockDistribution API (Color Management)

**Note:** These endpoints need to be added to the controller. Currently managed through ItemService.

### 16. Create Stock Distribution (Add Color)
**Endpoint:** Should be added as **POST** `/items/item-stock-distributions`

**Request Body:**
```json
{
  "itemStockId": 1,
  "colorCategoryId": 1,        // Optional: null = no specific color
  "quantity": 40
}
```

**Expected Response:**
```json
{
  "id": 1,
  "quantity": 40,
  "itemStock": {
    "id": 1,
    "item": {
      "id": 1,
      "name": "T-Shirt"
    }
  },
  "colorCategory": {
    "id": 1,
    "name": "Black",
    "hexCode": "#000000"
  },
  "createdAt": "2025-01-12T10:00:00Z"
}
```

---

### 17. Get All Stock Distributions
**Endpoint:** Should be **GET** `/items/item-stock-distributions`

---

### 18. Update Stock Distribution
**Endpoint:** Should be **PUT** `/items/item-stock-distributions/:id`

---

### 19. Delete Stock Distribution
**Endpoint:** Should be **DELETE** `/items/item-stock-distributions/:id`

---

## ColorCategory API

### 20. Create Color Category
**POST** `/color-categories`

**Request Body:**
```json
{
  "name": "Black",
  "hexCode": "#000000",
  "description": "Black color items"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Black",
  "hexCode": "#000000",
  "description": "Black color items",
  "createdAt": "2025-01-12T10:00:00Z",
  "updatedAt": "2025-01-12T10:00:00Z",
  "active": true
}
```

---

### 21. Get All Color Categories
**GET** `/color-categories`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Black",
    "hexCode": "#000000",
    "description": "Black color items",
    "createdAt": "2025-01-12T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Blue",
    "hexCode": "#0000FF",
    "description": "Blue color items",
    "createdAt": "2025-01-12T10:00:00Z"
  }
]
```

---

### 22. Get Single Color Category
**GET** `/color-categories/:id`

---

### 23. Update Color Category
**PUT** `/color-categories/:id`

**Request Body:**
```json
{
  "name": "Navy Blue",
  "hexCode": "#000080"
}
```

---

### 24. Delete Color Category
**DELETE** `/color-categories/:id`

---

## ItemPrice API

### 25. Create Item Price
**POST** `/items/item-prices`

**Request Body:**
```json
{
  "itemId": 1,
  "purchasePrice": 10.00,
  "freightCost": 2.00,
  "profitMargin": 0.25,
  "sellingPrice": 15.00,
  "isActive": true,
  "effectiveDate": "2025-01-12T00:00:00Z",
  "purchaseAccountId": 1,
  "freightAccountId": 2,
  "saleAccountId": 3
}
```

---

### 26-29. Other ItemPrice CRUD
- **GET** `/items/item-prices` - Get all prices
- **GET** `/items/item-prices/:id` - Get single price
- **PUT** `/items/item-prices/:id` - Update price
- **DELETE** `/items/item-prices/:id` - Delete price

---

## Usage Examples

### Example 1: Create Item with Color Distribution

**Step 1:** Create Color Categories
```bash
# Create Black
POST /color-categories
{
  "name": "Black",
  "hexCode": "#000000"
}
# Response: { id: 1, name: "Black", ... }

# Create Blue
POST /color-categories
{
  "name": "Blue",
  "hexCode": "#0000FF"
}
# Response: { id: 2, name: "Blue", ... }
```

**Step 2:** Create Item
```bash
POST /items
{
  "name": "T-Shirt",
  "businessId": 1,
  "categoryId": 1,
  "warehouseId": 1,
  "purchaseAmountId": 1,
  "freightAmountId": 1,
  "profitMargin": 0.25,
  "sellingPriceId": 1,
  "stockQuantity": 100,
  "saleAccountId": 1,
  "inventoryAccountId": 1,
  "costOfGoodsAccountId": 1
}
# Response: { id: 1, name: "T-Shirt", code: "PROD-001", ... }
```

**Step 3:** Create ItemStock
```bash
POST /items/item-stocks
{
  "itemId": 1,
  "warehouseId": 1,
  "quantity": 100
}
# Response: { id: 1, quantity: 100, ... }
```

**Step 4:** Add Color Distributions (Service methods available, need controller endpoints)
```typescript
// In your frontend, call these service methods:
// Note: These need to be exposed via controller

// Add 40 Black T-Shirts
itemService.createItemStockDistribution({
  itemStockId: 1,
  colorCategoryId: 1,  // Black
  quantity: 40
});

// Add 60 Blue T-Shirts
itemService.createItemStockDistribution({
  itemStockId: 1,
  colorCategoryId: 2,  // Blue
  quantity: 60
});
```

---

### Example 2: Query Item with Color Breakdown

```bash
GET /items/1

Response:
{
  "id": 1,
  "name": "T-Shirt",
  "code": "PROD-001",
  "stock": [
    {
      "id": 1,
      "quantity": 100,
      "warehouse": { "id": 1, "name": "Main Warehouse" },
      "distributions": [
        {
          "id": 1,
          "quantity": 40,
          "colorCategory": {
            "id": 1,
            "name": "Black",
            "hexCode": "#000000"
          }
        },
        {
          "id": 2,
          "quantity": 60,
          "colorCategory": {
            "id": 2,
            "name": "Blue",
            "hexCode": "#0000FF"
          }
        }
      ]
    }
  ]
}
```

---

### Example 3: Frontend TypeScript Interfaces

```typescript
// Frontend type definitions
export interface Item {
  id: number;
  name: string;
  code: string;
  desc?: string;
  imageUrl?: string;
  condition: 'new' | 'used';
  category?: Category;
  warehouse?: Warehouse;
  supplier?: ItemSupplier;
  business: Business;
  prices: ItemPrice[];
  stock: ItemStock[];
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface ItemStock {
  id: number;
  quantity: number;
  reorderPoint?: number;
  item: Item;
  warehouse: Warehouse;
  distributions: ItemStockDistribution[];
  createdAt: string;
  updatedAt: string;
}

export interface ItemStockDistribution {
  id: number;
  quantity: number;
  itemStock: ItemStock;
  colorCategory?: ColorCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ColorCategory {
  id: number;
  name: string;
  hexCode?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface ItemPrice {
  id: number;
  purchasePrice: number;
  freightCost: number;
  profitMargin: number;
  sellingPrice: number;
  isActive: boolean;
  effectiveDate: string;
  item: Item;
  createdAt: string;
  updatedAt: string;
}
```

---

### Example 4: React Query Hooks (Frontend)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

// Get all items with color distributions
export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data } = await axios.get<Item[]>(`${API_BASE}/items`);
      return data;
    },
  });
};

// Get all color categories
export const useColorCategories = () => {
  return useQuery({
    queryKey: ['colorCategories'],
    queryFn: async () => {
      const { data } = await axios.get<ColorCategory[]>(
        `${API_BASE}/color-categories`
      );
      return data;
    },
  });
};

// Create item stock distribution
export const useCreateStockDistribution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateItemStockDistributionDto) => {
      // Note: This endpoint needs to be added to controller
      const { data } = await axios.post(
        `${API_BASE}/items/item-stock-distributions`,
        dto
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['itemStocks'] });
    },
  });
};

// Upload item image
export const useUploadItemImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await axios.post(
        `${API_BASE}/items/${id}/upload-image`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items', variables.id] });
    },
  });
};
```

---

## Important Notes

### 1. Missing Controller Endpoints
The ItemStockDistribution CRUD methods exist in the service but are NOT exposed via controller. You need to add these endpoints:

```typescript
// Add to item.controller.ts

@Post('item-stock-distributions')
async createItemStockDistribution(
  @Body() dto: CreateItemStockDistributionDto,
): Promise<ItemStockDistribution> {
  return this.itemService.createItemStockDistribution(dto);
}

@Get('item-stock-distributions')
async findAllItemStockDistributions(): Promise<ItemStockDistribution[]> {
  return this.itemService.findAllItemStockDistributions();
}

@Get('item-stock-distributions/:id')
async findOneItemStockDistribution(
  @Param('id', ParseIntPipe) id: number,
): Promise<ItemStockDistribution> {
  return this.itemService.findOneItemStockDistribution(id);
}

@Put('item-stock-distributions/:id')
async updateItemStockDistribution(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateItemStockDistributionDto,
): Promise<ItemStockDistribution> {
  return this.itemService.updateItemStockDistribution(id, dto);
}

@Delete('item-stock-distributions/:id')
async removeItemStockDistribution(
  @Param('id', ParseIntPipe) id: number,
): Promise<void> {
  return this.itemService.removeItemStockDistribution(id);
}
```

### 2. Auto-generated Product Codes
- Format: `PROD-001`, `PROD-002`, `PROD-003`, etc.
- Automatically generated if `code` field is omitted
- Can be manually specified if needed

### 3. Color Distribution Logic
- One ItemStock per Item + Warehouse combination
- Multiple ItemStockDistributions per ItemStock (one per color)
- Total ItemStock.quantity should equal sum of all distributions
- Distributions are optional (items without color variations won't have any)

### 4. Database Schema
All entities are automatically synced to database via TypeORM `synchronize: true`.

Tables created:
- `item`
- `item_stock`
- `item_stock_distribution`
- `color_categories`
- `item_price`
- `item_account_mapping`

---

## Summary

This API provides comprehensive inventory management with:
- ✅ Item CRUD operations
- ✅ Stock management per warehouse
- ✅ Color-based stock distribution
- ✅ Price management
- ✅ Image upload/management (Cloudinary)
- ✅ Account mapping for financial tracking
- ✅ Automatic product code generation
- ✅ Low stock monitoring
- ✅ Stock value calculations

**Next Steps for Frontend:**
1. Add controller endpoints for ItemStockDistribution
2. Implement color picker UI for ColorCategory management
3. Build inventory dashboard showing color breakdowns
4. Create forms for item creation with color distribution
5. Display color-coded stock levels in inventory views
