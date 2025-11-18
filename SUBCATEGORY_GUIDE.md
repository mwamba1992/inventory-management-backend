# Subcategory Implementation Guide

## ✅ Subcategory Functionality Completed!

Your inventory management system now supports **hierarchical categories** with subcategories!

---

## 📋 What's Been Added

### 1. **Self-Referencing Category Structure**
Categories (Common entity) can now have parent-child relationships:
- **Parent Categories** (e.g., "Electronics", "Clothing", "Accessories")
- **Subcategories** (e.g., "Smartphones", "Laptops" under "Electronics")

### 2. **Items Can Belong to Subcategories**
Items now support both:
- `categoryId` - Main category (optional)
- `subcategoryId` - Subcategory (optional)

### 3. **New API Endpoints**
- Get root categories (categories without a parent)
- Get subcategories for a specific category
- Full category hierarchy in responses

---

## 🚀 API Endpoints

### 1. Create a Category (Root Level)

**Endpoint:** `POST /common`

**Request Body:**
```json
{
  "code": "ELECTRONICS",
  "description": "Electronic Items",
  "type": "ITEM_CATEGORY"
}
```

**Response:**
```json
{
  "id": 1,
  "code": "ELECTRONICS",
  "description": "Electronic Items",
  "type": "ITEM_CATEGORY",
  "parentCategory": null,
  "subcategories": []
}
```

---

### 2. Create a Subcategory

**Endpoint:** `POST /common`

**Request Body:**
```json
{
  "code": "SMARTPHONES",
  "description": "Smartphones and Mobile Devices",
  "type": "ITEM_CATEGORY",
  "parentCategoryId": 1
}
```

**Response:**
```json
{
  "id": 2,
  "code": "SMARTPHONES",
  "description": "Smartphones and Mobile Devices",
  "type": "ITEM_CATEGORY",
  "parentCategory": {
    "id": 1,
    "code": "ELECTRONICS",
    "description": "Electronic Items"
  },
  "subcategories": []
}
```

---

### 3. Get All Categories (With Hierarchy)

**Endpoint:** `GET /common`

**Response:**
```json
[
  {
    "id": 1,
    "code": "ELECTRONICS",
    "description": "Electronic Items",
    "type": "ITEM_CATEGORY",
    "parentCategory": null,
    "subcategories": [
      {
        "id": 2,
        "code": "SMARTPHONES",
        "description": "Smartphones and Mobile Devices",
        "type": "ITEM_CATEGORY"
      },
      {
        "id": 3,
        "code": "LAPTOPS",
        "description": "Laptop Computers",
        "type": "ITEM_CATEGORY"
      }
    ]
  }
]
```

---

### 4. Get Root Categories Only

**Endpoint:** `GET /common/root-categories`

**Description:** Returns only top-level categories (no parent)

**Response:**
```json
[
  {
    "id": 1,
    "code": "ELECTRONICS",
    "description": "Electronic Items",
    "type": "ITEM_CATEGORY",
    "subcategories": [
      {
        "id": 2,
        "code": "SMARTPHONES",
        "description": "Smartphones and Mobile Devices"
      }
    ]
  },
  {
    "id": 4,
    "code": "CLOTHING",
    "description": "Clothing Items",
    "type": "ITEM_CATEGORY",
    "subcategories": []
  }
]
```

---

### 5. Get Subcategories for a Category

**Endpoint:** `GET /common/:id/subcategories`

**Example:** `GET /common/1/subcategories`

**Response:**
```json
[
  {
    "id": 2,
    "code": "SMARTPHONES",
    "description": "Smartphones and Mobile Devices",
    "type": "ITEM_CATEGORY",
    "parentCategory": {
      "id": 1,
      "code": "ELECTRONICS"
    }
  },
  {
    "id": 3,
    "code": "LAPTOPS",
    "description": "Laptop Computers",
    "type": "ITEM_CATEGORY",
    "parentCategory": {
      "id": 1,
      "code": "ELECTRONICS"
    }
  }
]
```

---

### 6. Create an Item with Subcategory

**Endpoint:** `POST /items`

**Request Body:**
```json
{
  "name": "Samsung Galaxy S24",
  "desc": "Latest Samsung flagship phone",
  "categoryId": 1,
  "subcategoryId": 2,
  "businessId": 1,
  "purchaseAmountId": 1,
  "freightAmountId": 1,
  "profitMargin": 0.25,
  "sellingPriceId": 1,
  "stockQuantity": 50,
  "saleAccountId": 1,
  "inventoryAccountId": 1,
  "costOfGoodsAccountId": 1
}
```

**Response:**
```json
{
  "id": 40,
  "name": "Samsung Galaxy S24",
  "code": "PROD-040",
  "desc": "Latest Samsung flagship phone",
  "category": {
    "id": 1,
    "code": "ELECTRONICS",
    "description": "Electronic Items"
  },
  "subcategory": {
    "id": 2,
    "code": "SMARTPHONES",
    "description": "Smartphones and Mobile Devices"
  },
  "business": {...},
  "prices": [...],
  "stock": [...]
}
```

---

## 📊 Database Schema

### Common Entity (Categories)

```typescript
@Entity()
export class Common {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  description: string;

  @Column()
  type: string;

  // Self-referencing relationship for subcategories
  @ManyToOne(() => Common, (common) => common.subcategories, { nullable: true })
  parentCategory: Common;

  @OneToMany(() => Common, (common) => common.parentCategory)
  subcategories: Common[];

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];
}
```

### Item Entity

```typescript
@Entity()
export class Item extends BaseEntity {
  // ... other fields

  @ManyToOne(() => Common, (category) => category.items, { nullable: true })
  category: Common;

  @ManyToOne(() => Common, { nullable: true })
  subcategory: Common;

  // ... other fields
}
```

---

## 🎨 Frontend Integration Examples

### React/TypeScript

```typescript
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  code: string;
  description: string;
  type: string;
  parentCategory?: Category;
  subcategories?: Category[];
}

// Component for category selector
const CategorySelector = () => {
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);

  // Load root categories on mount
  useEffect(() => {
    fetch('https://business.mwendavano.com/api/common/root-categories')
      .then(res => res.json())
      .then(data => setRootCategories(data));
  }, []);

  // Load subcategories when a category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetch(`https://business.mwendavano.com/api/common/${selectedCategory}/subcategories`)
        .then(res => res.json())
        .then(data => setSubcategories(data));
    } else {
      setSubcategories([]);
      setSelectedSubcategory(null);
    }
  }, [selectedCategory]);

  return (
    <div>
      {/* Category Dropdown */}
      <select
        value={selectedCategory || ''}
        onChange={(e) => setSelectedCategory(Number(e.target.value))}
      >
        <option value="">Select Category</option>
        {rootCategories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.description}
          </option>
        ))}
      </select>

      {/* Subcategory Dropdown */}
      {subcategories.length > 0 && (
        <select
          value={selectedSubcategory || ''}
          onChange={(e) => setSelectedSubcategory(Number(e.target.value))}
        >
          <option value="">Select Subcategory (Optional)</option>
          {subcategories.map(subcat => (
            <option key={subcat.id} value={subcat.id}>
              {subcat.description}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

// Create item with category and subcategory
const createItem = async (itemData: {
  name: string;
  categoryId: number;
  subcategoryId?: number;
  // ... other fields
}) => {
  const response = await fetch('https://business.mwendavano.com/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    throw new Error('Failed to create item');
  }

  return response.json();
};
```

### Vue/Nuxt Example

```vue
<template>
  <div>
    <select v-model="selectedCategory" @change="loadSubcategories">
      <option :value="null">Select Category</option>
      <option v-for="cat in categories" :key="cat.id" :value="cat.id">
        {{ cat.description }}
      </option>
    </select>

    <select v-if="subcategories.length > 0" v-model="selectedSubcategory">
      <option :value="null">Select Subcategory (Optional)</option>
      <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
        {{ sub.description }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const categories = ref([]);
const subcategories = ref([]);
const selectedCategory = ref(null);
const selectedSubcategory = ref(null);

// Load root categories
const { data: categoriesData } = await useFetch('https://business.mwendavano.com/api/common/root-categories');
categories.value = categoriesData.value;

// Load subcategories when category changes
const loadSubcategories = async () => {
  if (!selectedCategory.value) {
    subcategories.value = [];
    selectedSubcategory.value = null;
    return;
  }

  const { data } = await useFetch(
    `https://business.mwendavano.com/api/common/${selectedCategory.value}/subcategories`
  );
  subcategories.value = data.value;
};
</script>
```

---

## 🔧 Common Use Cases

### Use Case 1: Create Category Hierarchy

```bash
# 1. Create parent category
curl -X POST https://business.mwendavano.com/api/common \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ELECTRONICS",
    "description": "Electronic Items",
    "type": "ITEM_CATEGORY"
  }'
# Response: { "id": 1, ... }

# 2. Create subcategories
curl -X POST https://business.mwendavano.com/api/common \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SMARTPHONES",
    "description": "Smartphones",
    "type": "ITEM_CATEGORY",
    "parentCategoryId": 1
  }'

curl -X POST https://business.mwendavano.com/api/common \
  -H "Content-Type: application/json" \
  -d '{
    "code": "LAPTOPS",
    "description": "Laptops",
    "type": "ITEM_CATEGORY",
    "parentCategoryId": 1
  }'
```

### Use Case 2: Filter Items by Category/Subcategory

```typescript
// Get all items
const items = await fetch('https://business.mwendavano.com/api/items').then(r => r.json());

// Filter by category
const electronicsItems = items.filter(item => item.category?.id === 1);

// Filter by subcategory
const smartphoneItems = items.filter(item => item.subcategory?.id === 2);

// Filter by category OR subcategory
const categoryItems = items.filter(item =>
  item.category?.id === 1 || item.subcategory?.parentCategory?.id === 1
);
```

### Use Case 3: Update Category to Become Subcategory

```bash
curl -X PUT https://business.mwendavano.com/api/common/5 \
  -H "Content-Type: application/json" \
  -d '{
    "parentCategoryId": 1
  }'
```

---

## 📝 Notes

### Important Points

1. **Optional Fields**: Both `categoryId` and `subcategoryId` are optional when creating items
2. **Flexibility**: You can have items with:
   - Only category (no subcategory)
   - Only subcategory (with parent category automatically linked)
   - Both category and subcategory
   - Neither (though not recommended)

3. **Hierarchy Levels**: Current implementation supports:
   - Root Category → Subcategory (1 level deep)
   - Can be extended to multiple levels if needed

4. **Relations**: When fetching items, both `category` and `subcategory` are automatically included in the response

### Best Practices

1. **Use Subcategories for Better Organization**
   - Electronics → Smartphones, Laptops, Tablets
   - Clothing → Men's Wear, Women's Wear, Kids' Wear
   - Jewelry → Watches, Rings, Necklaces

2. **Consistent Naming**
   - Use clear, descriptive names
   - Follow a naming convention (e.g., UPPERCASE for codes)

3. **Type Consistency**
   - Use the same `type` value for all categories (e.g., "ITEM_CATEGORY")

---

## 🧪 Testing

### Quick Test Commands

```bash
# 1. Get all root categories
curl https://business.mwendavano.com/api/common/root-categories

# 2. Get all categories (with hierarchy)
curl https://business.mwendavano.com/api/common

# 3. Get subcategories for category ID 7
curl https://business.mwendavano.com/api/common/7/subcategories

# 4. Get a specific category with full details
curl https://business.mwendavano.com/api/common/7
```

---

## ✅ Complete Example: Creating Products with Categories

```bash
# Step 1: Create "WATCHES" parent category
curl -X POST https://business.mwendavano.com/api/common \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WATCHES",
    "description": "All Watch Products",
    "type": "ITEM_CATEGORY"
  }'
# Response: { "id": 10, ...}

# Step 2: Create "SMART_WATCHES" subcategory
curl -X POST https://business.mwendavano.com/api/common \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SMART_WATCHES",
    "description": "Smart Watches",
    "type": "ITEM_CATEGORY",
    "parentCategoryId": 10
  }'
# Response: { "id": 11, ... }

# Step 3: Create a product in the subcategory
curl -X POST https://business.mwendavano.com/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Apple Watch Series 9",
    "desc": "Latest Apple Watch",
    "categoryId": 10,
    "subcategoryId": 11,
    "businessId": 1,
    "purchaseAmountId": 1,
    "freightAmountId": 1,
    "profitMargin": 0.25,
    "sellingPriceId": 1,
    "stockQuantity": 20,
    "saleAccountId": 1,
    "inventoryAccountId": 1,
    "costOfGoodsAccountId": 1
  }'
```

---

## 🎉 Summary

Subcategory functionality is now fully implemented! You can:
- ✅ Create hierarchical categories (parent → subcategory)
- ✅ Assign items to categories and/or subcategories
- ✅ Query root categories separately
- ✅ Get all subcategories for any category
- ✅ Full API support with all CRUD operations

Your inventory system is now ready for better product organization! 🚀
