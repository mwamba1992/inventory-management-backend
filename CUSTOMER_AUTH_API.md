# Customer Authentication API Documentation

Complete API documentation for customer authentication in your e-commerce store.

---

## 🔐 Authentication Flow

### For New Customers:
1. Customer registers with phone + password → `POST /api/customer-auth/register`
2. Receives JWT token
3. Uses token for all authenticated requests

### For Existing Customers (from checkout):
1. Customer who placed order via checkout → `POST /api/customer-auth/set-password`
2. Login with phone + password → `POST /api/customer-auth/login`
3. Receives JWT token

---

## 📋 API Endpoints

### Base URL
```
Production: https://business.mwendavano.com/api
Local: http://localhost:3000/api
```

---

## 1. Register New Customer

Create a new customer account with phone and password.

**Endpoint:** `POST /api/customer-auth/register`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+255712345678",
  "password": "password123",
  "email": "john@example.com",
  "city": "Dar es Salaam",
  "region": "Kinondoni"
}
```

**Required Fields:**
- `name` (string) - Customer full name
- `phone` (string) - Customer phone number (must be unique)
- `password` (string, min 6 characters) - Account password

**Optional Fields:**
- `email` (string) - Customer email
- `city` (string) - Customer city
- `region` (string) - Customer region

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "phone": "+255712345678",
    "email": "john@example.com",
    "city": "Dar es Salaam",
    "region": "Kinondoni",
    "hasPassword": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (409):**
```json
{
  "statusCode": 409,
  "message": "Customer with this phone number already exists. Please login instead.",
  "error": "Conflict"
}
```

---

## 2. Login Customer

Login with phone number and password.

**Endpoint:** `POST /api/customer-auth/login`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "phone": "+255712345678",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful!",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "phone": "+255712345678",
    "email": "john@example.com",
    "city": "Dar es Salaam",
    "region": "Kinondoni",
    "hasPassword": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid phone number or password",
  "error": "Unauthorized"
}
```

**Error Response (401) - No Password Set:**
```json
{
  "statusCode": 401,
  "message": "Please set a password first. Use the \"Set Password\" option.",
  "error": "Unauthorized"
}
```

---

## 3. Set Password (For Existing Customers)

For customers who placed orders via checkout but never set a password.

**Endpoint:** `POST /api/customer-auth/set-password`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "phone": "+255712345678",
  "password": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password set successfully! You can now login."
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Customer not found. Please register first.",
  "error": "Not Found"
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Password already set. Please use login or change password.",
  "error": "Bad Request"
}
```

---

## 4. Get Customer Profile

Get the logged-in customer's profile information. **Requires authentication.**

**Endpoint:** `GET /api/customer-auth/me`

**Request Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "customer": {
    "id": 1,
    "name": "John Doe",
    "phone": "+255712345678",
    "email": "john@example.com",
    "city": "Dar es Salaam",
    "region": "Kinondoni",
    "hasPassword": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Access token is missing",
  "error": "Unauthorized"
}
```

---

## 5. Update Customer Profile

Update the logged-in customer's profile. **Requires authentication.**

**Endpoint:** `PUT /api/customer-auth/profile`

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Body (all fields optional):**
```json
{
  "name": "John M. Doe",
  "email": "john.doe@example.com",
  "city": "Dar es Salaam",
  "region": "Ilala"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully!",
  "customer": {
    "id": 1,
    "name": "John M. Doe",
    "phone": "+255712345678",
    "email": "john.doe@example.com",
    "city": "Dar es Salaam",
    "region": "Ilala",
    "hasPassword": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## 6. Change Password

Change password for the logged-in customer. **Requires authentication.**

**Endpoint:** `POST /api/customer-auth/change-password`

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully!"
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Current password is incorrect",
  "error": "Unauthorized"
}
```

---

## 7. Get Customer Orders

Get all orders for the logged-in customer. **Requires authentication.**

**Endpoint:** `GET /api/customer-auth/orders`

**Request Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "totalOrders": 3,
  "orders": [
    {
      "id": 45,
      "orderNumber": "EC2501150001",
      "totalAmount": 750000,
      "status": "delivered",
      "paymentStatus": "paid",
      "paymentMethod": "cash_on_delivery",
      "orderSource": "ecommerce",
      "deliveryAddress": "House 123, Mikocheni, Dar es Salaam",
      "notes": null,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "confirmedAt": "2024-01-15T11:00:00.000Z",
      "deliveredAt": "2024-01-15T14:30:00.000Z",
      "rating": 5,
      "feedback": "Great service!",
      "items": [
        {
          "id": 89,
          "name": "Samsung Galaxy S24",
          "code": "PROD-040",
          "imageUrl": "https://res.cloudinary.com/...",
          "quantity": 2,
          "unitPrice": 350000,
          "totalPrice": 700000
        },
        {
          "id": 90,
          "name": "Phone Case",
          "code": "PROD-041",
          "imageUrl": "https://res.cloudinary.com/...",
          "quantity": 2,
          "unitPrice": 25000,
          "totalPrice": 50000
        }
      ]
    },
    {
      "id": 43,
      "orderNumber": "EC2501140002",
      "totalAmount": 450000,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash_on_delivery",
      "orderSource": "ecommerce",
      "deliveryAddress": "House 456, Kariakoo, Dar es Salaam",
      "notes": "Call before delivery",
      "createdAt": "2024-01-14T15:20:00.000Z",
      "confirmedAt": null,
      "deliveredAt": null,
      "rating": null,
      "feedback": null,
      "items": [
        {
          "id": 87,
          "name": "Apple Watch Series 9",
          "code": "PROD-035",
          "imageUrl": "https://res.cloudinary.com/...",
          "quantity": 1,
          "unitPrice": 450000,
          "totalPrice": 450000
        }
      ]
    }
  ]
}
```

---

## 8. Get Order Statistics

Get order statistics for the logged-in customer. **Requires authentication.**

**Endpoint:** `GET /api/customer-auth/orders/stats`

**Request Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 5,
    "pendingOrders": 1,
    "confirmedOrders": 1,
    "deliveredOrders": 3,
    "cancelledOrders": 0,
    "totalSpent": 2150000,
    "averageOrderValue": 430000
  }
}
```

---

## 🌐 Frontend Integration Examples

### React/TypeScript

#### Setup Axios Instance with Auth

```typescript
// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://business.mwendavano.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Auth Context

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  region?: string;
}

interface AuthContextType {
  customer: Customer | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  phone: string;
  password: string;
  email?: string;
  city?: string;
  region?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('customerToken');
    const savedCustomer = localStorage.getItem('customer');

    if (savedToken && savedCustomer) {
      setToken(savedToken);
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const response = await api.post('/customer-auth/login', { phone, password });

      const { customer: customerData, access_token } = response.data;

      setCustomer(customerData);
      setToken(access_token);

      localStorage.setItem('customerToken', access_token);
      localStorage.setItem('customer', JSON.stringify(customerData));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/customer-auth/register', data);

      const { customer: customerData, access_token } = response.data;

      setCustomer(customerData);
      setToken(access_token);

      localStorage.setItem('customerToken', access_token);
      localStorage.setItem('customer', JSON.stringify(customerData));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
  };

  const updateProfile = async (data: Partial<Customer>) => {
    try {
      const response = await api.put('/customer-auth/profile', data);

      const updatedCustomer = response.data.customer;
      setCustomer(updatedCustomer);
      localStorage.setItem('customer', JSON.stringify(updatedCustomer));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Login Component

```typescript
// src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(phone, password);
      navigate('/dashboard'); // Redirect to dashboard after login
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Customer Login</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+255712345678"
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
};
```

#### Register Component

```typescript
// src/components/Register.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
    city: '',
    region: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard'); // Redirect after registration
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Create Account</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+255712345678"
            required
          />
        </div>

        <div>
          <label>Password * (min 6 characters)</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            minLength={6}
            required
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label>City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>

        <div>
          <label>Region</label>
          <input
            type="text"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
};
```

#### Customer Dashboard

```typescript
// src/components/CustomerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: any[];
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
}

export const CustomerDashboard: React.FC = () => {
  const { customer, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/customer-auth/orders'),
        api.get('/customer-auth/orders/stats'),
      ]);

      setOrders(ordersRes.data.orders);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Welcome, {customer?.name}!</h1>
        <button onClick={logout}>Logout</button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Orders</h3>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Orders</h3>
            <p className="stat-value">{stats.pendingOrders}</p>
          </div>
          <div className="stat-card">
            <h3>Delivered</h3>
            <p className="stat-value">{stats.deliveredOrders}</p>
          </div>
          <div className="stat-card">
            <h3>Total Spent</h3>
            <p className="stat-value">TZS {stats.totalSpent.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="orders-section">
        <h2>My Orders</h2>
        {orders.length === 0 ? (
          <p>No orders yet</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <h3>Order #{order.orderNumber}</h3>
                  <span className={`status ${order.status}`}>
                    {order.status}
                  </span>
                </div>
                <p>Total: TZS {order.totalAmount.toLocaleString()}</p>
                <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="item">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} />
                      )}
                      <span>{item.name} x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

#### Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

#### App Routes

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🔐 Token Management

### Token Expiration
- Customer tokens expire after **30 days**
- Store token in `localStorage` or secure storage
- Include token in `Authorization` header for protected routes

### Token Storage Example
```typescript
// After login/register
localStorage.setItem('customerToken', access_token);

// Before each API call
const token = localStorage.getItem('customerToken');
headers: {
  'Authorization': `Bearer ${token}`
}

// On logout or token expiration
localStorage.removeItem('customerToken');
```

---

## 🚨 Error Handling

### Common Errors

**401 Unauthorized:**
- Token missing or invalid
- Token expired
- Wrong credentials

**409 Conflict:**
- Phone number already registered

**400 Bad Request:**
- Validation errors (password too short, invalid email, etc.)

**404 Not Found:**
- Customer not found (when setting password)

### Example Error Handler

```typescript
try {
  await api.post('/customer-auth/login', { phone, password });
} catch (error: any) {
  if (error.response?.status === 401) {
    setError('Invalid phone number or password');
  } else if (error.response?.status === 409) {
    setError('Account already exists. Please login.');
  } else {
    setError('An error occurred. Please try again.');
  }
}
```

---

## ✅ Testing the API

### Test with cURL

**Register:**
```bash
curl -X POST https://business.mwendavano.com/api/customer-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "+255700000001",
    "password": "test123",
    "email": "test@example.com",
    "city": "Dar es Salaam"
  }'
```

**Login:**
```bash
curl -X POST https://business.mwendavano.com/api/customer-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+255700000001",
    "password": "test123"
  }'
```

**Get Profile (with token):**
```bash
curl -X GET https://business.mwendavano.com/api/customer-auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get Orders (with token):**
```bash
curl -X GET https://business.mwendavano.com/api/customer-auth/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎯 Complete User Flow

### New Customer Journey:
1. **Browse products** (no auth needed)
2. **Add to cart** (no auth needed)
3. **Checkout** → Can checkout as guest OR register
4. **Register during checkout** → `POST /customer-auth/register`
5. **Receive order confirmation** with JWT token
6. **View order status** → `GET /customer-auth/orders` (authenticated)
7. **Track orders** in customer dashboard

### Returning Customer Journey:
1. **Login** → `POST /customer-auth/login`
2. **View past orders** → `GET /customer-auth/orders`
3. **Browse and shop** with saved profile
4. **Quick checkout** with saved delivery info

### Guest Customer Converting to Account:
1. Customer placed order via checkout (guest)
2. Receives email/SMS: "Set password to track your order"
3. **Set password** → `POST /customer-auth/set-password`
4. **Login** → `POST /customer-auth/login`
5. **View all orders** (including past guest orders)

---

## 📝 Summary

✅ **8 API Endpoints** for complete customer authentication
✅ **JWT-based authentication** with 30-day token expiration
✅ **Password security** with bcrypt hashing
✅ **Guest-to-account conversion** with set-password flow
✅ **Order history** and statistics for customers
✅ **Profile management** (update name, email, city, region)
✅ **Password change** with current password verification

**All endpoints are live at:** `https://business.mwendavano.com/api/customer-auth/*`

**Remember to deploy the updated backend to production for these endpoints to work!**
