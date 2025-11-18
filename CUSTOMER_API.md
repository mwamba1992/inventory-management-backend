# Customer API Documentation

## 📍 Production Endpoint

**Base URL:** `https://business.mwendavano.com/api`

**All customer endpoints are working correctly!** ✅

---

## 🔍 Available Endpoints

### 1. Get All Customers

**Endpoint:** `GET /customers`

**Description:** Retrieve all customers in the system

**Example:**
```bash
curl https://business.mwendavano.com/api/customers
```

**Response:** (Array of customers)
```json
[
  {
    "id": 25,
    "name": "Test Customer",
    "phone": "255712345678",
    "email": "john@example.com",
    "city": "Dar es Salaam",
    "region": "Kinondoni",
    "createdAt": "2025-10-21T13:53:57.345Z",
    "updatedAt": "2025-11-13T15:08:52.948Z"
  },
  {
    "id": 27,
    "name": "jo_delems",
    "phone": "255753107301",
    "email": null,
    "city": null,
    "region": null,
    "createdAt": "2025-10-22T10:10:52.022Z",
    "updatedAt": "2025-10-22T10:10:52.022Z"
  }
]
```

---

### 2. Get Total Customers Count

**Endpoint:** `GET /customers/total`

**Description:** Get the total number of customers

**Example:**
```bash
curl https://business.mwendavano.com/api/customers/total
```

**Response:**
```
32
```

---

### 3. Get Single Customer by ID

**Endpoint:** `GET /customers/:id`

**Description:** Retrieve a specific customer by their ID

**Example:**
```bash
curl https://business.mwendavano.com/api/customers/25
```

**Response:**
```json
{
  "id": 25,
  "name": "Test Customer",
  "phone": "255712345678",
  "email": "john@example.com",
  "city": "Dar es Salaam",
  "region": "Kinondoni",
  "createdAt": "2025-10-21T13:53:57.345Z",
  "updatedAt": "2025-11-13T15:08:52.948Z"
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Customer not found"
}
```

---

### 4. Create New Customer

**Endpoint:** `POST /customers`

**Description:** Create a new customer

**Request Body:**
```json
{
  "name": "Jane Doe",
  "phone": "255712345679",
  "email": "jane@example.com",
  "city": "Dar es Salaam",
  "region": "Ilala"
}
```

**Required Fields:**
- `name` (string) - Customer's full name
- `phone` (string) - Phone number (10-15 digits)

**Optional Fields:**
- `email` (string) - Email address (valid email format)
- `city` (string) - City name
- `region` (string) - Region/District name

**Example:**
```bash
curl -X POST https://business.mwendavano.com/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "255712345679",
    "email": "jane@example.com",
    "city": "Dar es Salaam",
    "region": "Ilala"
  }'
```

**Response:**
```json
{
  "id": 34,
  "name": "Jane Doe",
  "phone": "255712345679",
  "email": "jane@example.com",
  "city": "Dar es Salaam",
  "region": "Ilala",
  "createdAt": "2025-11-13T16:00:00.000Z",
  "updatedAt": "2025-11-13T16:00:00.000Z"
}
```

---

### 5. Update Customer

**Endpoint:** `PUT /customers/:id`

**Description:** Update an existing customer's information

**Request Body:** (All fields optional)
```json
{
  "name": "Jane Smith",
  "email": "janesmith@example.com",
  "city": "Arusha",
  "region": "Arusha City"
}
```

**Example:**
```bash
curl -X PUT https://business.mwendavano.com/api/customers/34 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "janesmith@example.com",
    "city": "Arusha"
  }'
```

**Response:**
```json
{
  "id": 34,
  "name": "Jane Doe",
  "phone": "255712345679",
  "email": "janesmith@example.com",
  "city": "Arusha",
  "region": "Ilala",
  "createdAt": "2025-11-13T16:00:00.000Z",
  "updatedAt": "2025-11-13T16:05:00.000Z"
}
```

---

### 6. Delete Customer

**Endpoint:** `DELETE /customers/:id`

**Description:** Delete a customer from the system

**Example:**
```bash
curl -X DELETE https://business.mwendavano.com/api/customers/34
```

**Response:**
```
(No content - HTTP 200)
```

---

## 🎨 Frontend Integration Examples

### React/TypeScript

```typescript
// Get all customers
const getCustomers = async () => {
  const response = await fetch('https://business.mwendavano.com/api/customers');
  const customers = await response.json();
  return customers;
};

// Get customer by ID
const getCustomer = async (id: number) => {
  const response = await fetch(`https://business.mwendavano.com/api/customers/${id}`);
  if (!response.ok) {
    throw new Error('Customer not found');
  }
  return response.json();
};

// Get total customers
const getTotalCustomers = async () => {
  const response = await fetch('https://business.mwendavano.com/api/customers/total');
  const total = await response.text();
  return parseInt(total);
};

// Create customer
const createCustomer = async (customerData: {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  region?: string;
}) => {
  const response = await fetch('https://business.mwendavano.com/api/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Update customer
const updateCustomer = async (id: number, updates: Partial<{
  name: string;
  phone: string;
  email: string;
  city: string;
  region: string;
}>) => {
  const response = await fetch(`https://business.mwendavano.com/api/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update customer');
  }

  return response.json();
};

// Delete customer
const deleteCustomer = async (id: number) => {
  const response = await fetch(`https://business.mwendavano.com/api/customers/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete customer');
  }
};
```

### Vue/Nuxt Example

```vue
<script setup lang="ts">
const customers = ref([]);
const loading = ref(false);

// Get all customers
const fetchCustomers = async () => {
  loading.value = true;
  try {
    const { data } = await useFetch('https://business.mwendavano.com/api/customers');
    customers.value = data.value;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
  } finally {
    loading.value = false;
  }
};

// Create customer
const createCustomer = async (customerData) => {
  try {
    const { data, error } = await useFetch('https://business.mwendavano.com/api/customers', {
      method: 'POST',
      body: customerData,
    });

    if (error.value) {
      throw new Error(error.value.message);
    }

    return data.value;
  } catch (err) {
    console.error('Failed to create customer:', err);
    throw err;
  }
};

onMounted(() => {
  fetchCustomers();
});
</script>
```

---

## 📊 Customer Object Structure

```typescript
interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  region: string | null;
  createdAt: string; // ISO 8601 date
  updatedAt: string; // ISO 8601 date
}
```

---

## ✅ Tested Endpoints

All endpoints have been tested on production and are working:

- ✅ `GET /customers` - Returns all 32 customers
- ✅ `GET /customers/total` - Returns count: 32
- ✅ `GET /customers/25` - Returns specific customer
- ✅ `POST /customers` - Creates new customer
- ✅ `PUT /customers/:id` - Updates customer
- ✅ `DELETE /customers/:id` - Deletes customer

---

## 🔧 Troubleshooting

### Getting 404 Error?

**Check these common issues:**

1. **Wrong URL Path**
   - ❌ `https://business.mwendavano.com/customers` (missing `/api`)
   - ✅ `https://business.mwendavano.com/api/customers`

2. **Missing `/api` Prefix**
   - All endpoints require `/api` prefix
   - Example: `/api/customers` not just `/customers`

3. **Typo in Endpoint**
   - Make sure it's `/customers` not `/customer`

4. **Browser CORS Issue**
   - If testing from browser console, CORS might block the request
   - Use Postman or cURL for testing

### Test Your Connection

```bash
# Quick test to verify customers endpoint
curl https://business.mwendavano.com/api/customers/total

# Should return: 32
```

---

## 📞 Support

If you continue to get 404 errors, please provide:
1. The exact URL you're calling
2. The HTTP method (GET, POST, etc.)
3. Any error messages
4. Screenshot of the request/response

The customer API is **fully functional** and tested on production! ✅
