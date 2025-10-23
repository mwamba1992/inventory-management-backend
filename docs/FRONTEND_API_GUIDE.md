# 🚀 Frontend API Integration Guide

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Swagger Documentation](#swagger-documentation)
- [Image Upload Integration](#image-upload-integration)
- [WhatsApp Admin Endpoints](#whatsapp-admin-endpoints)
- [Items/Products API](#itemsproducts-api)
- [Sales API](#sales-api)
- [Customers API](#customers-api)
- [Code Examples](#code-examples)

---

## 🎯 Getting Started

### Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

### CORS
CORS is enabled for all origins in development.

### Authentication
Currently no authentication required. (Add JWT when ready)

---

## 📚 Swagger Documentation

### Interactive API Documentation
**URL:** http://localhost:3000/api-docs

Features:
- 📖 Complete API documentation
- 🧪 Test endpoints directly in browser
- 📥 Download OpenAPI JSON spec
- 💡 Request/Response examples

### OpenAPI JSON
**URL:** http://localhost:3000/api-docs-json

Download the JSON spec for code generation tools like:
- `openapi-generator`
- `swagger-codegen`
- Auto-generate TypeScript types

### Raw JSON File
**File:** `swagger-spec.json` (generated at project root)

---

## 📸 Image Upload Integration

### 1. Upload Image (Recommended)

**Endpoint:** `POST /items/:id/upload-image`

Upload image file directly to Cloudinary with automatic optimization.

#### React/TypeScript Example:

```typescript
import { useState } from 'react';

const ProductImageUpload = ({ itemId }: { itemId: number }) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(
        `http://localhost:3000/items/${itemId}/upload-image`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      setImageUrl(data.imageUrl);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {imageUrl && <img src={imageUrl} alt="Product" style={{ maxWidth: 200 }} />}
    </div>
  );
};
```

#### Axios Example:

```typescript
import axios from 'axios';

const uploadProductImage = async (itemId: number, file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post(
      `http://localhost:3000/items/${itemId}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Usage
const file = document.querySelector('input[type="file"]').files[0];
const result = await uploadProductImage(1, file);
console.log('Image URL:', result.imageUrl);
```

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1234567890/inventory/products/abc123.jpg",
  "item": {
    "id": 1,
    "name": "Product Name",
    "imageUrl": "https://res.cloudinary.com/.../abc123.jpg",
    ...
  }
}
```

---

### 2. Update Image URL Manually

**Endpoint:** `PUT /items/:id/image`

Use this if you already have an image URL from another source.

```typescript
const updateImageUrl = async (itemId: number, imageUrl: string) => {
  const response = await fetch(`http://localhost:3000/items/${itemId}/image`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl }),
  });

  return response.json();
};

// Usage
await updateImageUrl(1, 'https://example.com/image.jpg');
```

---

### 3. Delete Image

**Endpoint:** `DELETE /items/:id/delete-image`

Deletes image from Cloudinary and removes URL from database.

```typescript
const deleteProductImage = async (itemId: number) => {
  const response = await fetch(
    `http://localhost:3000/items/${itemId}/delete-image`,
    {
      method: 'DELETE',
    }
  );

  return response.json();
};

// Usage
await deleteProductImage(1);
```

---

## 📱 WhatsApp Admin Endpoints

### Get All WhatsApp Orders

**Endpoint:** `GET /whatsapp/orders`

```typescript
const getAllOrders = async () => {
  const response = await fetch('http://localhost:3000/whatsapp/orders');
  return response.json();
};

// Response
[
  {
    "id": 1,
    "orderNumber": "WA2510230001",
    "customerPhone": "255676107301",
    "customer": {
      "id": 1,
      "name": "John Doe",
      "phone": "255676107301"
    },
    "warehouse": {
      "id": 1,
      "name": "Main Warehouse"
    },
    "items": [
      {
        "id": 1,
        "item": {
          "id": 1,
          "name": "Product Name",
          "imageUrl": "https://..."
        },
        "quantity": 2,
        "unitPrice": 10000,
        "totalPrice": 20000
      }
    ],
    "totalAmount": 20000,
    "status": "pending",
    "deliveryAddress": "123 Main St",
    "createdAt": "2025-10-23T10:00:00Z"
  }
]
```

---

### Get Order by ID

**Endpoint:** `GET /whatsapp/orders/:id`

```typescript
const getOrder = async (orderId: number) => {
  const response = await fetch(`http://localhost:3000/whatsapp/orders/${orderId}`);
  return response.json();
};
```

---

### Update Order Status

**Endpoint:** `PUT /whatsapp/orders/:id/status`

**Statuses:** `pending`, `confirmed`, `processing`, `ready`, `delivered`, `cancelled`

```typescript
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled';

const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
  const response = await fetch(
    `http://localhost:3000/whatsapp/orders/${orderId}/status`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }
  );

  return response.json();
};

// Usage
await updateOrderStatus(1, 'confirmed'); // Customer receives WhatsApp notification
await updateOrderStatus(1, 'delivered'); // Stock deducted, sale record created
```

**Important:**
- When status changes to `delivered`, stock is automatically deducted and sale record is created
- Customer receives WhatsApp notification for each status change

---

### Cancel Order

**Endpoint:** `PUT /whatsapp/orders/:id/cancel`

```typescript
const cancelOrder = async (orderId: number) => {
  const response = await fetch(
    `http://localhost:3000/whatsapp/orders/${orderId}/cancel`,
    {
      method: 'PUT',
    }
  );

  return response.json();
};
```

---

### Get Order Statistics

**Endpoint:** `GET /whatsapp/stats/orders`

```typescript
const getOrderStats = async () => {
  const response = await fetch('http://localhost:3000/whatsapp/stats/orders');
  return response.json();
};

// Response
{
  "total": 150,
  "pending": 10,
  "confirmed": 5,
  "processing": 3,
  "ready": 2,
  "delivered": 125,
  "cancelled": 5,
  "totalRevenue": 5000000
}
```

---

### Get Customer Orders

**Endpoint:** `GET /whatsapp/orders/phone/:phone`

```typescript
const getCustomerOrders = async (phoneNumber: string) => {
  const response = await fetch(
    `http://localhost:3000/whatsapp/orders/phone/${phoneNumber}`
  );
  return response.json();
};

// Usage
await getCustomerOrders('255676107301');
```

---

### Generate Product WhatsApp Link

**Endpoint:** `GET /whatsapp/product-link/:itemId`

Generate a click-to-chat WhatsApp link for a product that customers can share.

```typescript
const generateProductLink = async (itemId: number) => {
  const response = await fetch(
    `http://localhost:3000/whatsapp/product-link/${itemId}`
  );
  return response.json();
};

// Response
{
  "whatsappLink": "https://wa.me/255676107301?text=ORDER%3A1",
  "item": {
    "id": 1,
    "name": "Product Name",
    "code": "PROD001",
    "imageUrl": "https://...",
    "price": 10000,
    "stock": 50
  }
}
```

---

## 📦 Items/Products API

### Get All Items

**Endpoint:** `GET /items`

```typescript
const getAllItems = async () => {
  const response = await fetch('http://localhost:3000/items');
  return response.json();
};
```

---

### Get Item by ID

**Endpoint:** `GET /items/:id`

```typescript
const getItem = async (itemId: number) => {
  const response = await fetch(`http://localhost:3000/items/${itemId}`);
  return response.json();
};
```

---

### Create Item

**Endpoint:** `POST /items`

```typescript
const createItem = async (itemData: CreateItemDto) => {
  const response = await fetch('http://localhost:3000/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });

  return response.json();
};

// Example
await createItem({
  name: 'New Product',
  code: 'PROD001',
  desc: 'Product description',
  imageUrl: 'https://example.com/image.jpg', // Optional
  categoryId: 1,
  warehouseId: 1,
  businessId: 1,
  purchaseAmountId: 1,
  freightAmountId: 1,
  profitMargin: 0.3,
  sellingPriceId: 1,
  stockQuantity: 100,
  saleAccountId: 1,
  inventoryAccountId: 1,
  costOfGoodsAccountId: 1,
});
```

---

### Update Item

**Endpoint:** `PUT /items/:id`

```typescript
const updateItem = async (itemId: number, updates: Partial<CreateItemDto>) => {
  const response = await fetch(`http://localhost:3000/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  return response.json();
};

// Example
await updateItem(1, {
  name: 'Updated Product Name',
  imageUrl: 'https://new-image.jpg',
});
```

---

## 💰 Sales API

### Create Sale

**Endpoint:** `POST /sales`

```typescript
const createSale = async (saleData: CreateSaleDto) => {
  const response = await fetch('http://localhost:3000/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });

  return response.json();
};
```

---

### Get All Sales

**Endpoint:** `GET /sales`

```typescript
const getAllSales = async () => {
  const response = await fetch('http://localhost:3000/sales');
  return response.json();
};
```

---

### Get Sales Metrics

**Endpoint:** `POST /sales/sales-metrics`

```typescript
const getSalesMetrics = async (startDate: string, endDate: string) => {
  const response = await fetch('http://localhost:3000/sales/sales-metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate }),
  });

  return response.json();
};

// Usage
await getSalesMetrics('2025-01-01', '2025-12-31');
```

---

## 👥 Customers API

### Get All Customers

**Endpoint:** `GET /customers`

```typescript
const getAllCustomers = async () => {
  const response = await fetch('http://localhost:3000/customers');
  return response.json();
};
```

---

### Create Customer

**Endpoint:** `POST /customers`

```typescript
const createCustomer = async (customerData: CreateCustomerDto) => {
  const response = await fetch('http://localhost:3000/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });

  return response.json();
};
```

---

## 💻 Complete Code Examples

### React Admin Dashboard Component

```typescript
import { useState, useEffect } from 'react';

interface WhatsAppOrder {
  id: number;
  orderNumber: string;
  customerPhone: string;
  customer: { name: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

const WhatsAppOrdersDashboard = () => {
  const [orders, setOrders] = useState<WhatsAppOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/whatsapp/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`http://localhost:3000/whatsapp/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      // Refresh orders
      fetchOrders();
      alert(`Order status updated to: ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>WhatsApp Orders</h1>
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{order.customer.name}</td>
              <td>TZS {order.totalAmount.toLocaleString()}</td>
              <td>{order.status}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WhatsAppOrdersDashboard;
```

---

### Product Form with Image Upload

```typescript
import { useState } from 'react';

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    desc: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Create product first
      const response = await fetch('http://localhost:3000/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessId: 1,
          categoryId: 1,
          warehouseId: 1,
          purchaseAmountId: 1,
          freightAmountId: 1,
          profitMargin: 0.3,
          sellingPriceId: 1,
          stockQuantity: 100,
          saleAccountId: 1,
          inventoryAccountId: 1,
          costOfGoodsAccountId: 1,
        }),
      });

      const item = await response.json();

      // 2. Upload image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        await fetch(`http://localhost:3000/items/${item.id}/upload-image`, {
          method: 'POST',
          body: formData,
        });
      }

      alert('Product created successfully!');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Product Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Product Code:</label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        />
      </div>

      <div>
        <label>Description:</label>
        <textarea
          value={formData.desc}
          onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
        />
      </div>

      <div>
        <label>Product Image:</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && (
          <img src={imagePreview} alt="Preview" style={{ maxWidth: 200 }} />
        )}
      </div>

      <button type="submit">Create Product</button>
    </form>
  );
};

export default ProductForm;
```

---

## 🎯 Quick Start Checklist

✅ **1. Access Swagger UI**
- Go to http://localhost:3000/api-docs
- Explore all endpoints

✅ **2. Test Image Upload**
- Use Swagger UI "Try it out" feature
- Or use Postman/Insomnia

✅ **3. Set up Cloudinary**
- See `docs/CLOUDINARY_SETUP.md`
- Add credentials to `.env`

✅ **4. Test WhatsApp Integration**
- Create product with image
- Send "menu" to WhatsApp bot
- Browse and order products

✅ **5. Build Admin Dashboard**
- Use code examples above
- Integrate with your frontend framework

---

## 📞 Support

**Issues:** GitHub Issues
**Documentation:** http://localhost:3000/api-docs
**Backend Repo:** https://github.com/yourusername/inventory-backend

---

## 🚀 Ready to Build!

You now have everything you need to integrate the API with your frontend:
- ✅ Interactive Swagger docs
- ✅ Complete code examples
- ✅ Image upload integration
- ✅ WhatsApp order management
- ✅ All CRUD operations

**Start building your amazing frontend!** 🎉
