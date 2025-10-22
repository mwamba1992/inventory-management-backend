# WhatsApp Admin API Documentation

Complete API documentation for managing WhatsApp orders from the admin panel.

## Base URL
```
http://localhost:3000/whatsapp
```

---

## Table of Contents
1. [Get All Orders](#1-get-all-orders)
2. [Get Order by ID](#2-get-order-by-id)
3. [Get Orders by Phone Number](#3-get-orders-by-phone-number)
4. [Update Order Status](#4-update-order-status)
5. [Cancel Order](#5-cancel-order)
6. [Get Order Statistics](#6-get-order-statistics)

---

## 1. Get All Orders

Retrieve all WhatsApp orders with full details including customer, items, and warehouse information.

### Endpoint
```
GET /whatsapp/orders
```

### Request
```bash
curl -X GET http://localhost:3000/whatsapp/orders
```

### Response
```json
[
  {
    "id": 1,
    "orderNumber": "WA2510220001",
    "customerPhone": "+255712345678",
    "totalAmount": 121000,
    "status": "pending",
    "deliveryAddress": "Mikocheni, Dar es Salaam",
    "notes": null,
    "createdAt": "2025-10-22T10:30:00.000Z",
    "confirmedAt": null,
    "deliveredAt": null,
    "customer": {
      "id": 1,
      "name": "John Doe",
      "phone": "+255712345678",
      "email": "john@example.com"
    },
    "warehouse": {
      "id": 1,
      "name": "Main Warehouse",
      "location": "Dar es Salaam"
    },
    "items": [
      {
        "id": 1,
        "quantity": 1,
        "unitPrice": 121000,
        "totalPrice": 121000,
        "item": {
          "id": 8,
          "code": "PROD-008",
          "name": "REDMIN WATCH MOVE",
          "desc": "redmi watch move"
        }
      }
    ]
  },
  {
    "id": 2,
    "orderNumber": "WA2510220002",
    "customerPhone": "+255798765432",
    "totalAmount": 450000,
    "status": "confirmed",
    "deliveryAddress": "Sinza, Dar es Salaam",
    "notes": "Deliver after 2 PM",
    "createdAt": "2025-10-22T11:15:00.000Z",
    "confirmedAt": "2025-10-22T11:20:00.000Z",
    "deliveredAt": null,
    "customer": {
      "id": 2,
      "name": "Jane Smith",
      "phone": "+255798765432",
      "email": "jane@example.com"
    },
    "warehouse": {
      "id": 1,
      "name": "Main Warehouse",
      "location": "Dar es Salaam"
    },
    "items": [
      {
        "id": 2,
        "quantity": 2,
        "unitPrice": 225000,
        "totalPrice": 450000,
        "item": {
          "id": 5,
          "code": "PROD-005",
          "name": "Wireless Mouse",
          "desc": "Logitech wireless mouse"
        }
      }
    ]
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique order ID |
| orderNumber | string | Order number (format: WA + YYMMDD + sequence) |
| customerPhone | string | Customer's phone number |
| totalAmount | number | Total order amount in TZS |
| status | string | Order status (pending, confirmed, processing, ready, delivered, cancelled) |
| deliveryAddress | string | Customer's delivery address |
| notes | string | Additional order notes |
| createdAt | datetime | Order creation timestamp |
| confirmedAt | datetime | Order confirmation timestamp |
| deliveredAt | datetime | Order delivery timestamp |
| customer | object | Customer details (if registered) |
| warehouse | object | Warehouse information |
| items | array | Array of order items with quantities and prices |

### Order Status Values
- `pending` - Order received, waiting for confirmation
- `confirmed` - Order confirmed by admin
- `processing` - Order is being prepared
- `ready` - Order is ready for delivery
- `delivered` - Order has been delivered
- `cancelled` - Order has been cancelled

---

## 2. Get Order by ID

Retrieve detailed information about a specific order.

### Endpoint
```
GET /whatsapp/orders/:id
```

### Request
```bash
curl -X GET http://localhost:3000/whatsapp/orders/1
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Order ID |

### Response
```json
{
  "id": 1,
  "orderNumber": "WA2510220001",
  "customerPhone": "+255712345678",
  "totalAmount": 121000,
  "status": "pending",
  "deliveryAddress": "Mikocheni, Dar es Salaam",
  "notes": null,
  "createdAt": "2025-10-22T10:30:00.000Z",
  "confirmedAt": null,
  "deliveredAt": null,
  "customer": {
    "id": 1,
    "name": "John Doe",
    "phone": "+255712345678",
    "email": "john@example.com"
  },
  "warehouse": {
    "id": 1,
    "name": "Main Warehouse",
    "location": "Dar es Salaam"
  },
  "items": [
    {
      "id": 1,
      "quantity": 1,
      "unitPrice": 121000,
      "totalPrice": 121000,
      "item": {
        "id": 8,
        "code": "PROD-008",
        "name": "REDMIN WATCH MOVE",
        "desc": "redmi watch move",
        "prices": [
          {
            "id": 1,
            "sellingPrice": 121000,
            "isActive": true
          }
        ],
        "stock": [
          {
            "id": 1,
            "quantity": 1,
            "warehouseId": 1
          }
        ]
      }
    }
  ]
}
```

### Error Response (404)
```json
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}
```

---

## 3. Get Orders by Phone Number

Retrieve all orders for a specific customer using their phone number.

### Endpoint
```
GET /whatsapp/orders/phone/:phone
```

### Request
```bash
curl -X GET http://localhost:3000/whatsapp/orders/phone/+255712345678
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Customer's phone number (URL encoded if contains +) |

### Alternative Request (URL Encoded)
```bash
curl -X GET http://localhost:3000/whatsapp/orders/phone/%2B255712345678
```

### Response
```json
[
  {
    "id": 1,
    "orderNumber": "WA2510220001",
    "customerPhone": "+255712345678",
    "totalAmount": 121000,
    "status": "delivered",
    "deliveryAddress": "Mikocheni, Dar es Salaam",
    "createdAt": "2025-10-20T10:30:00.000Z",
    "deliveredAt": "2025-10-20T15:00:00.000Z",
    "items": [
      {
        "quantity": 1,
        "unitPrice": 121000,
        "item": {
          "name": "REDMIN WATCH MOVE"
        }
      }
    ]
  },
  {
    "id": 5,
    "orderNumber": "WA2510220005",
    "customerPhone": "+255712345678",
    "totalAmount": 450000,
    "status": "pending",
    "deliveryAddress": "Mikocheni, Dar es Salaam",
    "createdAt": "2025-10-22T10:30:00.000Z",
    "deliveredAt": null,
    "items": [
      {
        "quantity": 2,
        "unitPrice": 225000,
        "item": {
          "name": "Wireless Mouse"
        }
      }
    ]
  }
]
```

---

## 4. Update Order Status

Update the status of an order. Automatically tracks confirmation and delivery timestamps.

### Endpoint
```
PUT /whatsapp/orders/:id/status
```

### Request
```bash
curl -X PUT http://localhost:3000/whatsapp/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Order ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New order status |

### Valid Status Values
- `pending`
- `confirmed`
- `processing`
- `ready`
- `delivered`
- `cancelled`

### Response
```json
{
  "id": 1,
  "orderNumber": "WA2510220001",
  "customerPhone": "+255712345678",
  "totalAmount": 121000,
  "status": "confirmed",
  "deliveryAddress": "Mikocheni, Dar es Salaam",
  "createdAt": "2025-10-22T10:30:00.000Z",
  "confirmedAt": "2025-10-22T12:15:30.000Z",
  "deliveredAt": null,
  "customer": {
    "id": 1,
    "name": "John Doe",
    "phone": "+255712345678"
  },
  "warehouse": {
    "id": 1,
    "name": "Main Warehouse"
  },
  "items": [
    {
      "id": 1,
      "quantity": 1,
      "unitPrice": 121000,
      "totalPrice": 121000
    }
  ]
}
```

### Status Update Examples

#### Confirm Order
```bash
curl -X PUT http://localhost:3000/whatsapp/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```
*Automatically sets `confirmedAt` timestamp on first confirmation*

#### Mark as Processing
```bash
curl -X PUT http://localhost:3000/whatsapp/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'
```

#### Mark as Ready
```bash
curl -X PUT http://localhost:3000/whatsapp/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}'
```

#### Mark as Delivered
```bash
curl -X PUT http://localhost:3000/whatsapp/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered"}'
```
*Automatically sets `deliveredAt` timestamp on first delivery*

### Error Response (404)
```json
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}
```

---

## 5. Cancel Order

Cancel an order and automatically restore inventory stock.

### Endpoint
```
PUT /whatsapp/orders/:id/cancel
```

### Request
```bash
curl -X PUT http://localhost:3000/whatsapp/orders/1/cancel
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Order ID |

### Response
```json
{
  "id": 1,
  "orderNumber": "WA2510220001",
  "customerPhone": "+255712345678",
  "totalAmount": 121000,
  "status": "cancelled",
  "deliveryAddress": "Mikocheni, Dar es Salaam",
  "createdAt": "2025-10-22T10:30:00.000Z",
  "confirmedAt": "2025-10-22T10:35:00.000Z",
  "deliveredAt": null,
  "customer": {
    "id": 1,
    "name": "John Doe",
    "phone": "+255712345678"
  },
  "warehouse": {
    "id": 1,
    "name": "Main Warehouse"
  },
  "items": [
    {
      "id": 1,
      "quantity": 1,
      "unitPrice": 121000,
      "totalPrice": 121000,
      "item": {
        "id": 8,
        "name": "REDMIN WATCH MOVE"
      }
    }
  ]
}
```

### Stock Restoration
When an order is cancelled, the system automatically:
1. Finds all items in the order
2. Locates the stock entries for each item in the order's warehouse
3. Adds the ordered quantity back to available stock
4. Logs the stock restoration

### Error Responses

#### Cannot Cancel Delivered Order (400)
```json
{
  "statusCode": 400,
  "message": "Cannot cancel a delivered order",
  "error": "Bad Request"
}
```

#### Order Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}
```

---

## 6. Get Order Statistics

Get comprehensive statistics about WhatsApp orders including totals, status breakdown, and revenue.

### Endpoint
```
GET /whatsapp/stats/orders
```

### Request
```bash
curl -X GET http://localhost:3000/whatsapp/stats/orders
```

### Response
```json
{
  "total": 25,
  "pending": 5,
  "confirmed": 8,
  "processing": 3,
  "ready": 2,
  "delivered": 6,
  "cancelled": 1,
  "totalRevenue": 5450000
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| total | number | Total number of orders |
| pending | number | Number of pending orders |
| confirmed | number | Number of confirmed orders |
| processing | number | Number of orders being processed |
| ready | number | Number of orders ready for delivery |
| delivered | number | Number of delivered orders |
| cancelled | number | Number of cancelled orders |
| totalRevenue | number | Total revenue from all non-cancelled orders (in TZS) |

### Usage Example (Frontend)

```typescript
// Fetch order statistics
const response = await fetch('http://localhost:3000/whatsapp/stats/orders');
const stats = await response.json();

console.log(`Total Orders: ${stats.total}`);
console.log(`Pending Orders: ${stats.pending}`);
console.log(`Total Revenue: TZS ${stats.totalRevenue.toLocaleString()}`);

// Calculate completion rate
const completionRate = (stats.delivered / stats.total) * 100;
console.log(`Completion Rate: ${completionRate.toFixed(2)}%`);
```

---

## Frontend Integration Examples

### React/Next.js Example

#### Fetch All Orders
```typescript
import { useState, useEffect } from 'react';

interface Order {
  id: number;
  orderNumber: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
    phone: string;
  };
  items: Array<{
    quantity: number;
    unitPrice: number;
    item: {
      name: string;
    };
  }>;
}

function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>WhatsApp Orders</h1>
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <h3>{order.orderNumber}</h3>
          <p>Customer: {order.customer?.name || order.customerPhone}</p>
          <p>Total: TZS {order.totalAmount.toLocaleString()}</p>
          <p>Status: {order.status}</p>
          <p>Items: {order.items.length}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Update Order Status
```typescript
const updateOrderStatus = async (orderId: number, newStatus: string) => {
  try {
    const response = await fetch(
      `http://localhost:3000/whatsapp/orders/${orderId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update order status');
    }

    const updatedOrder = await response.json();
    console.log('Order updated:', updatedOrder);

    // Refresh orders list
    fetchOrders();
  } catch (error) {
    console.error('Error updating order:', error);
  }
};

// Usage
<button onClick={() => updateOrderStatus(1, 'confirmed')}>
  Confirm Order
</button>
```

#### Cancel Order
```typescript
const cancelOrder = async (orderId: number) => {
  if (!confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/whatsapp/orders/${orderId}/cancel`,
      {
        method: 'PUT',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel order');
    }

    const cancelledOrder = await response.json();
    alert(`Order ${cancelledOrder.orderNumber} has been cancelled. Stock restored.`);

    // Refresh orders list
    fetchOrders();
  } catch (error) {
    console.error('Error cancelling order:', error);
    alert(error.message);
  }
};

// Usage
<button onClick={() => cancelOrder(1)} className="btn-danger">
  Cancel Order
</button>
```

#### Display Order Statistics Dashboard
```typescript
import { useEffect, useState } from 'react';

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  ready: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

function OrderStatistics() {
  const [stats, setStats] = useState<OrderStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/whatsapp/stats/orders');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!stats) return <div>Loading statistics...</div>;

  return (
    <div className="statistics-dashboard">
      <h2>Order Statistics</h2>

      <div className="stat-card">
        <h3>Total Orders</h3>
        <p className="stat-value">{stats.total}</p>
      </div>

      <div className="stat-card">
        <h3>Pending</h3>
        <p className="stat-value pending">{stats.pending}</p>
      </div>

      <div className="stat-card">
        <h3>Confirmed</h3>
        <p className="stat-value confirmed">{stats.confirmed}</p>
      </div>

      <div className="stat-card">
        <h3>Processing</h3>
        <p className="stat-value processing">{stats.processing}</p>
      </div>

      <div className="stat-card">
        <h3>Ready</h3>
        <p className="stat-value ready">{stats.ready}</p>
      </div>

      <div className="stat-card">
        <h3>Delivered</h3>
        <p className="stat-value delivered">{stats.delivered}</p>
      </div>

      <div className="stat-card">
        <h3>Cancelled</h3>
        <p className="stat-value cancelled">{stats.cancelled}</p>
      </div>

      <div className="stat-card highlight">
        <h3>Total Revenue</h3>
        <p className="stat-value revenue">
          TZS {stats.totalRevenue.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
```

#### Customer Order History
```typescript
const CustomerOrderHistory = ({ phoneNumber }: { phoneNumber: string }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerOrders();
  }, [phoneNumber]);

  const fetchCustomerOrders = async () => {
    try {
      // URL encode phone number
      const encodedPhone = encodeURIComponent(phoneNumber);
      const response = await fetch(
        `http://localhost:3000/whatsapp/orders/phone/${encodedPhone}`
      );
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading customer orders...</div>;

  return (
    <div>
      <h2>Order History for {phoneNumber}</h2>
      {orders.length === 0 ? (
        <p>No orders found for this customer.</p>
      ) : (
        <div className="order-list">
          {orders.map(order => (
            <div key={order.id} className="order-item">
              <h3>{order.orderNumber}</h3>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p>Total: TZS {order.totalAmount.toLocaleString()}</p>
              <p>Status: <span className={`status-${order.status}`}>{order.status}</span></p>
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index}>
                    {item.quantity}x {item.item.name} - TZS {item.totalPrice.toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Usage
<CustomerOrderHistory phoneNumber="+255712345678" />
```

---

## Status Color Coding (UI Recommendation)

```css
.status-pending {
  color: #f59e0b; /* Orange */
  background-color: #fef3c7;
}

.status-confirmed {
  color: #3b82f6; /* Blue */
  background-color: #dbeafe;
}

.status-processing {
  color: #8b5cf6; /* Purple */
  background-color: #ede9fe;
}

.status-ready {
  color: #06b6d4; /* Cyan */
  background-color: #cffafe;
}

.status-delivered {
  color: #10b981; /* Green */
  background-color: #d1fae5;
}

.status-cancelled {
  color: #ef4444; /* Red */
  background-color: #fee2e2;
}
```

---

## Error Handling

All endpoints follow standard HTTP status codes:

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 404 | Resource Not Found |
| 500 | Internal Server Error |

### Example Error Response
```json
{
  "statusCode": 400,
  "message": "Cannot cancel a delivered order",
  "error": "Bad Request"
}
```

---

## Notes

1. **Stock Management**: When an order is created, stock is automatically deducted. When cancelled, stock is automatically restored.

2. **Timestamps**: The system automatically tracks:
   - `confirmedAt` - Set when status changes to "confirmed" for the first time
   - `deliveredAt` - Set when status changes to "delivered" for the first time

3. **Phone Number Format**: Phone numbers should include country code (e.g., +255712345678)

4. **Order Numbers**: Auto-generated in format: WA + YYMMDD + 4-digit sequence

5. **Revenue Calculation**: Total revenue excludes cancelled orders

---

## Support

For issues or questions, please contact the development team or check the main README.md file.
