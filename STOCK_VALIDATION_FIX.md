# Stock Validation Fix

## ✅ Issue Fixed!

**Problem:** E-commerce orders were failing with "Insufficient stock" errors even when stock was available.

**Root Cause:** When fetching items, the `stock.warehouse` relationship was not being loaded, causing warehouse ID comparisons to fail during stock validation.

---

## 🔧 What Was Changed

### Updated File: `src/items/item/item.service.ts`

**In `findAll()` method (line 96-110):**

**Before:**
```typescript
async findAll(): Promise<Item[]> {
  return this.itemRepository.find({
    relations: [
      'category',
      'subcategory',
      'warehouse',
      'supplier',
      'business',
      'prices',
      'stock',  // ❌ Warehouse not loaded
    ],
    order: { createdAt: 'DESC' },
  });
}
```

**After:**
```typescript
async findAll(): Promise<Item[]> {
  return this.itemRepository.find({
    relations: [
      'category',
      'subcategory',
      'warehouse',
      'supplier',
      'business',
      'prices',
      'stock',
      'stock.warehouse',  // ✅ Warehouse now loaded
    ],
    order: { createdAt: 'DESC' },
  });
}
```

**In `findOne()` method (line 112-129):**

**Before:**
```typescript
async findOne(id: number): Promise<Item> {
  const item = await this.itemRepository.findOne({
    where: { id },
    relations: [
      'category',
      'subcategory',
      'warehouse',
      'supplier',
      'business',
      'prices',
      'stock',  // ❌ Warehouse not loaded
    ],
  });

  if (!item) throw new NotFoundException('Item not found');
  return item;
}
```

**After:**
```typescript
async findOne(id: number): Promise<Item> {
  const item = await this.itemRepository.findOne({
    where: { id },
    relations: [
      'category',
      'subcategory',
      'warehouse',
      'supplier',
      'business',
      'prices',
      'stock',
      'stock.warehouse',  // ✅ Warehouse now loaded
    ],
  });

  if (!item) throw new NotFoundException('Item not found');
  return item;
}
```

---

## 🚀 Deployment Instructions

**YOU MUST DEPLOY THE UPDATED CODE TO PRODUCTION FOR THIS FIX TO WORK!**

### Option 1: Deploy with PM2 (Most Common)

```bash
# Build the project (already done locally)
npm run build

# Restart PM2 process
pm2 restart inventory-backend

# Or reload for zero-downtime restart
pm2 reload inventory-backend

# Check logs to verify restart
pm2 logs inventory-backend --lines 50
```

### Option 2: Deploy with Docker

```bash
# Rebuild the Docker image
docker build -t inventory-backend .

# Restart container
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f --tail=50
```

### Option 3: Deploy with systemd

```bash
# Build the project
npm run build

# Restart the service
sudo systemctl restart inventory-backend

# Check status
sudo systemctl status inventory-backend

# Check logs
sudo journalctl -u inventory-backend -f
```

### Option 4: Manual Node Process

```bash
# Build the project
npm run build

# Kill existing process
pkill -f "node dist/main"

# Start in production mode
nohup npm run start:prod > backend.log 2>&1 &

# Or if using process manager
npm run start:prod &
```

---

## 🧪 Testing After Deployment

### Test 1: Verify Warehouse Data is Loaded

```bash
# Check that warehouse info is now included in item stock
curl -s 'https://business.mwendavano.com/api/items/2' | \
  python3 -c "import sys, json; data = json.load(sys.stdin); stock = data.get('stock', []); print(f\"Item: {data.get('name')}\"); [print(f\"Stock: {s.get('quantity')} units in {s.get('warehouse', {}).get('name', 'ERROR: Warehouse not loaded!')}\") for s in stock]"

# Expected output:
# Item: SAMSUNG FIT 3
# Stock: 7 units in Main Warehouse (or actual warehouse name)

# If you still see "ERROR: Warehouse not loaded!" then the backend hasn't restarted yet
```

### Test 2: Place a Test Order

**From browser console at `https://store.mwendavano.com`:**

```javascript
fetch('https://business.mwendavano.com/api/whatsapp/ecommerce-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerName: 'Test Customer',
    customerPhone: '+255700000000',
    customerEmail: 'test@example.com',
    customerCity: 'Dar es Salaam',
    customerRegion: 'Kinondoni',
    warehouseId: 1,
    items: [
      {
        itemId: 2,  // SAMSUNG FIT 3 (has 7 in stock)
        quantity: 1,
        unitPrice: 350000
      }
    ],
    deliveryAddress: 'Test Address, Dar es Salaam',
    notes: 'Test order to verify stock validation fix'
  })
})
  .then(response => response.json())
  .then(data => console.log('✅ Order created successfully!', data))
  .catch(error => console.error('❌ Order failed:', error));
```

**Expected result:** Order should be created successfully without stock errors.

### Test 3: Verify Stock Validation Still Works

Try ordering more than available:

```javascript
fetch('https://business.mwendavano.com/api/whatsapp/ecommerce-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerName: 'Test Customer',
    customerPhone: '+255700000000',
    warehouseId: 1,
    items: [
      {
        itemId: 2,
        quantity: 999,  // More than available
        unitPrice: 350000
      }
    ],
    deliveryAddress: 'Test Address'
  })
})
  .then(response => response.json())
  .then(data => console.log('Response:', data))
  .catch(error => console.error('Expected error:', error));
```

**Expected result:** Should fail with clear error message about insufficient stock.

---

## 🔍 How the Fix Works

### Before the Fix:

```typescript
// In whatsapp-order.service.ts
const item = await this.itemService.findOne(itemDto.itemId);

// item.stock was loaded BUT stock.warehouse was undefined
// So this comparison always failed:
const itemStock = item.stock?.find((s) => s.warehouse?.id === warehouse.id);
//                                         ^^^^^^^^^^^^^ undefined!

// Result: Stock check always failed even when stock existed
```

### After the Fix:

```typescript
// In whatsapp-order.service.ts
const item = await this.itemService.findOne(itemDto.itemId);

// item.stock AND stock.warehouse are both loaded
// So this comparison now works correctly:
const itemStock = item.stock?.find((s) => s.warehouse?.id === warehouse.id);
//                                         ^^^^^^^^^^^^^ properly loaded!

// Result: Stock check correctly finds matching warehouse stock
```

---

## 📊 Technical Details

### TypeORM Nested Relations

TypeORM requires explicit loading of nested relations:

```typescript
// ❌ This loads stock but NOT stock.warehouse
relations: ['stock']

// ✅ This loads stock AND stock.warehouse
relations: ['stock', 'stock.warehouse']
```

### Stock Validation Logic

The e-commerce order service validates stock by:

1. Fetching the item with `itemService.findOne(itemId)`
2. Finding stock for the requested warehouse:
   ```typescript
   const itemStock = item.stock?.find((s) => s.warehouse?.id === warehouse.id);
   ```
3. Checking if sufficient quantity is available:
   ```typescript
   if (!itemStock || itemStock.quantity < itemDto.quantity) {
     throw new BadRequestException(`Insufficient stock...`);
   }
   ```

For step 2 to work, the warehouse object must be loaded within each stock record.

---

## ✅ Verification Checklist

After deploying, verify:

- [ ] Backend service is running
- [ ] Build was successful
- [ ] Backend has been restarted (PM2/Docker/systemd)
- [ ] Test item endpoint shows warehouse data in stock
- [ ] Can place orders for items with available stock
- [ ] Orders correctly fail when requesting more than available
- [ ] No errors in backend logs
- [ ] E-commerce orders working from frontend

---

## 🚨 Troubleshooting

### Issue: Still getting "Insufficient stock" errors

**Possible causes:**

1. **Backend not restarted:**
   ```bash
   # Check if process is running old code
   pm2 status
   # Restart again
   pm2 restart inventory-backend
   ```

2. **Check warehouse ID mismatch:**
   ```bash
   # Verify warehouse ID in order matches warehouse ID in stock
   curl -s 'https://business.mwendavano.com/api/warehouses'
   ```

3. **Verify item has stock in that warehouse:**
   ```bash
   curl -s 'https://business.mwendavano.com/api/items/ITEM_ID' | \
     python3 -c "import sys, json; data = json.load(sys.stdin); [print(f\"Warehouse {s['warehouse']['id']} ({s['warehouse']['name']}): {s['quantity']} units\") for s in data.get('stock', [])]"
   ```

4. **Check backend logs for actual error:**
   ```bash
   pm2 logs inventory-backend --lines 100
   # or
   journalctl -u inventory-backend -n 100
   ```

### Issue: Warehouse still showing as None in API

This means the backend hasn't been restarted yet. The fix is in the code, but the running server is still using the old compiled version.

**Solution:** Restart the backend service using one of the deployment methods above.

---

## 📝 Related Files

- `src/items/item/item.service.ts` - Fixed warehouse relation loading
- `src/whatsapp/services/whatsapp-order.service.ts` - Stock validation logic
- `ECOMMERCE_ORDER_API.md` - E-commerce order API documentation
- `CORS_FIX_GUIDE.md` - CORS configuration guide

---

## 🎉 Summary

✅ **Root cause identified:** Warehouse relation not loaded with stock
✅ **Fix implemented:** Added 'stock.warehouse' to relations in findOne() and findAll()
✅ **Build successful:** Compiled code contains the fix
✅ **Next step:** Deploy to production and restart backend service

**After deployment, your e-commerce orders will work correctly!** 🚀
