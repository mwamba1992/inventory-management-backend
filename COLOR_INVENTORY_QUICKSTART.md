# Color-Based Inventory Management - Quick Start Guide

## Overview
This system allows you to track inventory by color. For example, if you have "T-Shirts" in Black and Blue, you can track how many of each color are in stock.

---

## Complete API Endpoints

### 🎨 Color Categories API

#### 1. Get All Colors
```bash
GET /color-categories
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Black",
    "hexCode": "#000000",
    "description": "Black color items",
    "active": true,
    "createdAt": "2025-01-12T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Blue",
    "hexCode": "#0000FF",
    "description": "Blue color items",
    "active": true,
    "createdAt": "2025-01-12T10:00:00Z"
  }
]
```

#### 2. Create Color Category
```bash
POST /color-categories
Content-Type: application/json

{
  "name": "Navy Blue",
  "hexCode": "#000080",
  "description": "Navy blue color items"
}
```

#### 3. Update Color Category
```bash
PUT /color-categories/:id
Content-Type: application/json

{
  "name": "Dark Blue",
  "hexCode": "#00008B"
}
```

#### 4. Delete Color Category
```bash
DELETE /color-categories/:id
```

---

### 📦 Item Stock Distribution API (Color Management)

#### 5. Create Stock Distribution (Add Color to Stock)
```bash
POST /items/item-stock-distributions
Content-Type: application/json

{
  "itemStockId": 1,          // Which stock record
  "colorCategoryId": 1,       // Which color (Black)
  "quantity": 40              // How many units
}
```

**Response:**
```json
{
  "id": 1,
  "quantity": 40,
  "itemStock": {
    "id": 1,
    "quantity": 100,
    "item": {
      "id": 1,
      "name": "T-Shirt",
      "code": "PROD-001"
    },
    "warehouse": {
      "id": 1,
      "name": "Main Warehouse"
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

#### 6. Get All Stock Distributions
```bash
GET /items/item-stock-distributions
```

**Response:**
```json
[
  {
    "id": 1,
    "quantity": 40,
    "itemStock": {
      "id": 1,
      "item": { "id": 1, "name": "T-Shirt" }
    },
    "colorCategory": {
      "id": 1,
      "name": "Black",
      "hexCode": "#000000"
    }
  },
  {
    "id": 2,
    "quantity": 60,
    "itemStock": {
      "id": 1,
      "item": { "id": 1, "name": "T-Shirt" }
    },
    "colorCategory": {
      "id": 2,
      "name": "Blue",
      "hexCode": "#0000FF"
    }
  }
]
```

#### 7. Get Single Stock Distribution
```bash
GET /items/item-stock-distributions/:id
```

#### 8. Update Stock Distribution
```bash
PUT /items/item-stock-distributions/:id
Content-Type: application/json

{
  "quantity": 50,              // Update quantity
  "colorCategoryId": 3         // Optional: change color
}
```

#### 9. Delete Stock Distribution
```bash
DELETE /items/item-stock-distributions/:id
```

---

## Complete Workflow Example

### Scenario: Add 100 T-Shirts (40 Black, 60 Blue)

#### Step 1: Verify Colors Exist
```bash
GET /color-categories
```

If Black and Blue don't exist, create them:
```bash
POST /color-categories
{
  "name": "Black",
  "hexCode": "#000000",
  "description": "Black color items"
}

POST /color-categories
{
  "name": "Blue",
  "hexCode": "#0000FF",
  "description": "Blue color items"
}
```

#### Step 2: Create Item (if not exists)
```bash
POST /items
{
  "name": "T-Shirt",
  "desc": "Cotton T-Shirt",
  "businessId": 1,
  "categoryId": 1,
  "purchaseAmountId": 1,
  "freightAmountId": 1,
  "profitMargin": 0.25,
  "sellingPriceId": 1,
  "stockQuantity": 100,
  "saleAccountId": 1,
  "inventoryAccountId": 1,
  "costOfGoodsAccountId": 1
}
```

Response: `{ id: 1, name: "T-Shirt", code: "PROD-001", ... }`

#### Step 3: Create Item Stock (One per Warehouse)
```bash
POST /items/item-stocks
{
  "itemId": 1,
  "warehouseId": 1,
  "quantity": 100              // Total quantity
}
```

Response: `{ id: 1, quantity: 100, ... }`

#### Step 4: Add Color Distributions

**Add 40 Black T-Shirts:**
```bash
POST /items/item-stock-distributions
{
  "itemStockId": 1,
  "colorCategoryId": 1,         // Black
  "quantity": 40
}
```

**Add 60 Blue T-Shirts:**
```bash
POST /items/item-stock-distributions
{
  "itemStockId": 1,
  "colorCategoryId": 2,         // Blue
  "quantity": 60
}
```

#### Step 5: Query Results

**Get Item with Color Breakdown:**
```bash
GET /items/1
```

**Response:**
```json
{
  "id": 1,
  "name": "T-Shirt",
  "code": "PROD-001",
  "stock": [
    {
      "id": 1,
      "quantity": 100,
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
}
```

---

## Common Use Cases

### Use Case 1: Update Color Quantity

**Scenario:** Sold 10 Black T-Shirts, need to reduce from 40 to 30

```bash
# First, get the distribution ID
GET /items/item-stock-distributions

# Find the Black distribution (id: 1) with quantity: 40
# Update it
PUT /items/item-stock-distributions/1
{
  "quantity": 30
}
```

### Use Case 2: Add New Color to Existing Stock

**Scenario:** Just received 20 Red T-Shirts

```bash
# 1. Make sure Red color exists
POST /color-categories
{
  "name": "Red",
  "hexCode": "#FF0000"
}
# Response: { id: 3, name: "Red", ... }

# 2. Update total stock quantity
PUT /items/item-stocks/1
{
  "quantity": 120              // Was 100, now 120
}

# 3. Add Red distribution
POST /items/item-stock-distributions
{
  "itemStockId": 1,
  "colorCategoryId": 3,         // Red
  "quantity": 20
}
```

### Use Case 3: Get All Items with Color Breakdown

```bash
GET /items

# Returns all items with their stock and distributions
```

### Use Case 4: Get Color Distribution Summary

```bash
GET /items/item-stock-distributions

# Returns all color distributions across all items
# Frontend can group by color to show:
# - Black: 140 units (across all items)
# - Blue: 200 units (across all items)
# - Red: 80 units (across all items)
```

---

## Frontend TypeScript Example

```typescript
// Types
interface ColorCategory {
  id: number;
  name: string;
  hexCode: string;
  description?: string;
}

interface ItemStockDistribution {
  id: number;
  quantity: number;
  itemStock: {
    id: number;
    item: {
      id: number;
      name: string;
      code: string;
    };
  };
  colorCategory: ColorCategory;
}

// API Calls
const api = 'http://localhost:3000';

// 1. Get all colors
const colors = await fetch(`${api}/color-categories`).then(r => r.json());

// 2. Create color distribution
const distribution = await fetch(`${api}/items/item-stock-distributions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemStockId: 1,
    colorCategoryId: 1,
    quantity: 40
  })
}).then(r => r.json());

// 3. Get all distributions
const distributions = await fetch(`${api}/items/item-stock-distributions`)
  .then(r => r.json());

// 4. Update distribution
await fetch(`${api}/items/item-stock-distributions/1`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 35 })
});

// 5. Delete distribution
await fetch(`${api}/items/item-stock-distributions/1`, {
  method: 'DELETE'
});
```

---

## React Component Example

```tsx
import { useState, useEffect } from 'react';

interface ColorDistribution {
  id: number;
  quantity: number;
  colorCategory: {
    id: number;
    name: string;
    hexCode: string;
  };
}

function ColorDistributionManager({ itemStockId }: { itemStockId: number }) {
  const [distributions, setDistributions] = useState<ColorDistribution[]>([]);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    // Fetch colors
    fetch('http://localhost:3000/color-categories')
      .then(r => r.json())
      .then(setColors);

    // Fetch distributions
    fetchDistributions();
  }, []);

  const fetchDistributions = async () => {
    const data = await fetch('http://localhost:3000/items/item-stock-distributions')
      .then(r => r.json());

    // Filter for this stock
    setDistributions(
      data.filter((d: any) => d.itemStock.id === itemStockId)
    );
  };

  const addColor = async (colorId: number, quantity: number) => {
    await fetch('http://localhost:3000/items/item-stock-distributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemStockId,
        colorCategoryId: colorId,
        quantity
      })
    });
    fetchDistributions();
  };

  return (
    <div>
      <h3>Color Distribution</h3>
      {distributions.map(dist => (
        <div key={dist.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: dist.colorCategory.hexCode,
              border: '1px solid #ccc'
            }}
          />
          <span>{dist.colorCategory.name}</span>
          <span>{dist.quantity} units</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Important Notes

### ✅ Best Practices

1. **Total Consistency**: ItemStock.quantity should equal the sum of all its distributions
   ```
   ItemStock.quantity = 100
   Distribution 1 (Black) = 40
   Distribution 2 (Blue) = 60
   Total = 40 + 60 = 100 ✓
   ```

2. **One Stock Per Warehouse**: Don't create duplicate ItemStock for the same Item+Warehouse
   ```
   ❌ Wrong:
   ItemStock 1: Item 1, Warehouse 1, Color Black
   ItemStock 2: Item 1, Warehouse 1, Color Blue

   ✅ Correct:
   ItemStock 1: Item 1, Warehouse 1, Total: 100
     ├─ Distribution 1: Black, 40
     └─ Distribution 2: Blue, 60
   ```

3. **Optional Colors**: Not all items need color distributions. If an item doesn't come in different colors, don't create distributions.

4. **Null Color Category**: You can create distributions without a color (colorCategoryId: null) for items that have variations other than color.

### ⚠️ Common Mistakes

1. **Forgetting to update total stock** when adding new colors
2. **Creating duplicate ItemStock** instead of using distributions
3. **Negative quantities** - always validate quantities > 0
4. **Orphaned distributions** - when deleting ItemStock, distributions should be deleted too (handled by database cascade)

---

## Database Schema

```
color_categories
├─ id
├─ name
├─ hexCode
├─ description
└─ (BaseEntity fields: createdAt, updatedAt, active, etc.)

item_stock
├─ id
├─ quantity (total)
├─ reorderPoint
├─ itemId → item
├─ warehouseId → warehouse
└─ distributions → item_stock_distribution[]

item_stock_distribution
├─ id
├─ quantity (for this color)
├─ itemStockId → item_stock
└─ colorCategoryId → color_categories (nullable)
```

---

## Testing the APIs

### Using cURL

```bash
# 1. Get colors
curl http://localhost:3000/color-categories

# 2. Create distribution
curl -X POST http://localhost:3000/items/item-stock-distributions \
  -H "Content-Type: application/json" \
  -d '{
    "itemStockId": 1,
    "colorCategoryId": 1,
    "quantity": 40
  }'

# 3. Get distributions
curl http://localhost:3000/items/item-stock-distributions

# 4. Update distribution
curl -X PUT http://localhost:3000/items/item-stock-distributions/1 \
  -H "Content-Type: application/json" \
  -d '{"quantity": 35}'

# 5. Delete distribution
curl -X DELETE http://localhost:3000/items/item-stock-distributions/1
```

### Using Postman

1. Import the base URL: `http://localhost:3000`
2. Create requests for each endpoint
3. Use environment variables for IDs

---

## Summary

✅ **Color Categories API**: Fully implemented at `/color-categories`

✅ **Stock Distribution API**: Fully implemented at `/items/item-stock-distributions`

✅ **30 Colors Pre-seeded**: Run `npm run seed:colors` to initialize

✅ **Complete CRUD**: Create, Read, Update, Delete for both colors and distributions

✅ **Swagger Docs**: Available at `http://localhost:3000/api` (if Swagger is configured)

---

## Next Steps

1. **Start your server**: `npm run start:dev`
2. **Verify colors**: `curl http://localhost:3000/color-categories`
3. **Test the flow**: Create item → Create stock → Add distributions
4. **Build UI**: Use the React example above as a starting point

You're all set! 🎉
