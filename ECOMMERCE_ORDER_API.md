# E-Commerce Order API Documentation

## 📍 Production Endpoint

**Base URL:** `https://business.mwendavano.com/api`

## 🛒 Create Order

### Endpoint
```
POST /whatsapp/ecommerce-order
```

### Request Body

```json
{
  "customerName": "John Doe",
  "customerPhone": "255712345678",
  "customerEmail": "john@example.com",
  "customerCity": "Dar es Salaam",
  "customerRegion": "Kinondoni",
  "warehouseId": 1,
  "items": [
    {
      "itemId": 2,
      "quantity": 2,
      "unitPrice": 240000
    }
  ],
  "deliveryAddress": "House 123, Street ABC, Kinondoni",
  "notes": "Please call before delivery",
  "paymentMethod": "cash_on_delivery"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerName` | string | Yes | Customer's full name |
| `customerPhone` | string | Yes | Phone number (255XXXXXXXXX format) |
| `customerEmail` | string | No | Customer's email address |
| `customerCity` | string | No | City name |
| `customerRegion` | string | No | Region/District name |
| `warehouseId` | number | Yes | Warehouse ID (usually 1) |
| `items` | array | Yes | Array of order items |
| `items[].itemId` | number | Yes | Product ID |
| `items[].quantity` | number | Yes | Quantity to order |
| `items[].unitPrice` | number | Yes | Price per unit at time of order |
| `deliveryAddress` | string | Yes | Full delivery address |
| `notes` | string | No | Special instructions for the order |
| `paymentMethod` | enum | No | Payment method: `cash_on_delivery` (default), `mobile_money`, `bank_transfer`, `card` |

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Order placed successfully! You will receive confirmation shortly.",
  "order": {
    "id": 123,
    "orderNumber": "EC2501130001",
    "totalAmount": 480000,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "cash_on_delivery",
    "orderSource": "ecommerce",
    "estimatedDelivery": "2-3 business days",
    "deliveryAddress": "House 123, Street ABC, Kinondoni",
    "notes": "Please call before delivery",
    "createdAt": "2025-11-13T15:30:00.000Z",
    "items": [
      {
        "id": 456,
        "name": "SAMSUNG FIT 3",
        "code": "PROD-002",
        "imageUrl": "https://res.cloudinary.com/.../product.jpg",
        "quantity": 2,
        "unitPrice": 240000,
        "totalPrice": 480000
      }
    ]
  },
  "customerOrders": [
    {
      "id": 123,
      "orderNumber": "EC2501130001",
      "totalAmount": 480000,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash_on_delivery",
      "orderSource": "ecommerce",
      "deliveryAddress": "House 123, Street ABC, Kinondoni",
      "createdAt": "2025-11-13T15:30:00.000Z",
      "confirmedAt": null,
      "deliveredAt": null,
      "items": [
        {
          "name": "SAMSUNG FIT 3",
          "code": "PROD-002",
          "imageUrl": "https://res.cloudinary.com/.../product.jpg",
          "quantity": 2,
          "unitPrice": 240000,
          "totalPrice": 480000
        }
      ]
    }
  ]
}
```

### Response Fields

#### Main Response
- `success` (boolean) - Always `true` on success
- `message` (string) - Success message to display to user
- `order` (object) - The newly created order details
- `customerOrders` (array) - **All customer orders including the new one** (sorted by date, newest first)

#### Order Object
- `id` - Order database ID
- `orderNumber` - Unique order number (e.g., "EC2501130001")
- `totalAmount` - Total order amount in TZS
- `status` - Order status: `pending`, `confirmed`, `processing`, `ready`, `delivered`, `cancelled`
- `paymentStatus` - Payment status: `pending`, `paid`, `failed`, `refunded`
- `paymentMethod` - How customer will pay
- `orderSource` - Always `ecommerce` for web orders
- `estimatedDelivery` - Delivery timeframe
- `deliveryAddress` - Where to deliver
- `notes` - Order notes
- `createdAt` - When order was placed
- `confirmedAt` - When admin confirmed (null if pending)
- `deliveredAt` - When order was delivered (null if not yet)
- `items` - Array of ordered products with details

### Error Responses

#### 400 Bad Request - Insufficient Stock
```json
{
  "message": "Insufficient stock for SAMSUNG FIT 3. Available: 5, Requested: 10",
  "error": "Bad Request",
  "statusCode": 400
}
```

#### 404 Not Found - Item Not Found
```json
{
  "message": "Item with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

#### 400 Bad Request - Validation Error
```json
{
  "message": ["customerPhone must be a string", "items must be an array"],
  "error": "Bad Request",
  "statusCode": 400
}
```

## 📦 Get Customer Orders

To get a customer's order history separately:

### Endpoint
```
GET /whatsapp/orders/phone/:phone
```

### Example
```bash
GET /whatsapp/orders/phone/255712345678
```

### Response
```json
[
  {
    "id": 123,
    "orderNumber": "EC2501130001",
    "totalAmount": 480000,
    "status": "delivered",
    "paymentStatus": "paid",
    "paymentMethod": "cash_on_delivery",
    "orderSource": "ecommerce",
    "deliveryAddress": "House 123, Street ABC, Kinondoni",
    "createdAt": "2025-11-10T10:00:00.000Z",
    "confirmedAt": "2025-11-10T10:30:00.000Z",
    "deliveredAt": "2025-11-12T14:00:00.000Z",
    "items": [...]
  },
  {
    "id": 122,
    "orderNumber": "EC2501100005",
    "totalAmount": 350400,
    "status": "pending",
    ...
  }
]
```

## 🎨 Frontend Integration Examples

### React/TypeScript Example

```typescript
import { useState } from 'react';

interface OrderItem {
  itemId: number;
  quantity: number;
  unitPrice: number;
}

interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCity?: string;
  customerRegion?: string;
  warehouseId: number;
  deliveryAddress: string;
  notes?: string;
  paymentMethod?: 'cash_on_delivery' | 'mobile_money' | 'bank_transfer' | 'card';
  items: OrderItem[];
}

interface OrderResponse {
  success: boolean;
  message: string;
  order: {
    id: number;
    orderNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    items: any[];
    createdAt: string;
  };
  customerOrders: any[];
}

const CheckoutPage = () => {
  const [loading, setLoading] = useState(false);
  const [orderResponse, setOrderResponse] = useState<OrderResponse | null>(null);

  const handlePlaceOrder = async (formData: any, cartItems: any[]) => {
    setLoading(true);

    try {
      const orderData: CreateOrderRequest = {
        customerName: formData.fullName,
        customerPhone: formData.phoneNumber,
        customerEmail: formData.email,
        customerCity: formData.city,
        customerRegion: formData.region,
        warehouseId: 1, // Your default warehouse
        deliveryAddress: formData.deliveryAddress,
        notes: formData.orderNotes,
        paymentMethod: formData.paymentMethod || 'cash_on_delivery',
        items: cartItems.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      };

      const response = await fetch('https://business.mwendavano.com/api/whatsapp/ecommerce-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const result: OrderResponse = await response.json();
      setOrderResponse(result);

      // Show success message
      alert(`✅ ${result.message}\\n\\nOrder Number: ${result.order.orderNumber}`);

      // Clear cart and redirect to order confirmation
      clearCart();
      navigate(`/order-confirmation/${result.order.orderNumber}`);

    } catch (error: any) {
      console.error('Order failed:', error);
      alert(`❌ ${error.message || 'Failed to place order. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your checkout form */}
      <button onClick={() => handlePlaceOrder(formData, cart)} disabled={loading}>
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>

      {/* Show customer's order history after successful order */}
      {orderResponse && (
        <div className="order-history">
          <h3>Your Orders ({orderResponse.customerOrders.length})</h3>
          {orderResponse.customerOrders.map(order => (
            <div key={order.id} className="order-card">
              <p>Order: {order.orderNumber}</p>
              <p>Status: {order.status}</p>
              <p>Total: TZS {order.totalAmount.toLocaleString()}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Vue/Nuxt Example

```vue
<script setup lang="ts">
const placeOrder = async () => {
  loading.value = true;

  try {
    const { data, error } = await useFetch('https://business.mwendavano.com/api/whatsapp/ecommerce-order', {
      method: 'POST',
      body: {
        customerName: form.value.fullName,
        customerPhone: form.value.phoneNumber,
        customerEmail: form.value.email,
        customerCity: form.value.city,
        customerRegion: form.value.region,
        warehouseId: 1,
        deliveryAddress: form.value.deliveryAddress,
        notes: form.value.notes,
        paymentMethod: form.value.paymentMethod,
        items: cart.value.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      },
    });

    if (error.value) {
      throw new Error(error.value.message);
    }

    // Success - show order details and customer history
    orderResult.value = data.value;
    customerOrders.value = data.value.customerOrders;

    alert(`Order placed successfully! Order #${data.value.order.orderNumber}`);
    navigateTo(`/order-confirmation/${data.value.order.orderNumber}`);

  } catch (err) {
    alert(err.message || 'Failed to place order');
  } finally {
    loading.value = false;
  }
};
</script>
```

## 📊 Order Statuses

| Status | Description | Customer Action |
|--------|-------------|-----------------|
| `pending` | Order received, awaiting admin confirmation | Wait for confirmation |
| `confirmed` | Admin confirmed, preparing order | Order is being prepared |
| `processing` | Order is being packed | No action needed |
| `ready` | Order ready for delivery | Delivery soon |
| `delivered` | Order delivered | No action needed |
| `cancelled` | Order was cancelled | Contact support if needed |

## 💳 Payment Statuses

| Status | Description |
|--------|-------------|
| `pending` | Payment not yet received |
| `paid` | Payment confirmed |
| `failed` | Payment failed |
| `refunded` | Payment refunded |

## ⚠️ Important Notes

1. **Stock Validation**: The system checks stock availability before accepting orders. If stock is insufficient, order will be rejected with a 400 error.

2. **Inventory Deduction**: Stock is **NOT deducted** when the order is placed. Stock is only deducted when admin marks the order as `delivered`.

3. **Customer Auto-Creation**: If the customer doesn't exist (by phone number), a new customer record is automatically created with the provided information.

4. **Customer Auto-Update**: If customer exists but is missing email/city/region, those fields are automatically updated with new information from the order.

5. **Order History**: The response automatically includes ALL customer's orders (sorted newest first), so you can immediately show their order history without a separate API call.

6. **Order Numbers**: E-commerce orders have "EC" prefix (e.g., EC2501130001), WhatsApp orders have "WA" prefix.

7. **Phone Format**: Use full international format: `255XXXXXXXXX` (Tanzania)

## 🔍 Testing

### Test with cURL
```bash
curl -X POST https://business.mwendavano.com/api/whatsapp/ecommerce-order \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "255712345678",
    "customerEmail": "test@example.com",
    "customerCity": "Dar es Salaam",
    "customerRegion": "Kinondoni",
    "warehouseId": 1,
    "items": [
      {
        "itemId": 2,
        "quantity": 1,
        "unitPrice": 240000
      }
    ],
    "deliveryAddress": "Test Address, Kinondoni",
    "paymentMethod": "cash_on_delivery"
  }'
```

## 📞 Support

For issues or questions, contact the backend team or check the main API documentation.
