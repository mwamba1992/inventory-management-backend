# WhatsApp Chatbot - Comprehensive Testing Guide

## 🧪 Testing Methods Overview

There are 4 ways to test the WhatsApp implementation:

1. **API Endpoint Testing** - Test backend without WhatsApp (Quick & Easy)
2. **Mock Webhook Testing** - Simulate WhatsApp messages locally (No Meta account needed)
3. **Local WhatsApp Testing** - Full integration with ngrok (Requires Meta account)
4. **Production Testing** - Test on deployed server (Final validation)

---

## Method 1: API Endpoint Testing (Fastest)

Test the order management APIs directly without WhatsApp integration.

### Prerequisites
- Application running: `npm run start:dev`
- API testing tool: cURL, Postman, or Thunder Client

### 1.1 Test Order Statistics

```bash
curl http://localhost:3000/whatsapp/stats/orders
```

**Expected Response:**
```json
{
  "total": 0,
  "pending": 0,
  "confirmed": 0,
  "processing": 0,
  "ready": 0,
  "delivered": 0,
  "cancelled": 0,
  "totalRevenue": 0
}
```

### 1.2 Create Test Data

First, ensure you have items with codes:

```sql
-- Connect to your database and run:
UPDATE core.item SET code = 'TEST001' WHERE id = 1;
UPDATE core.item SET code = 'TEST002' WHERE id = 2;
```

### 1.3 Test Order Creation Programmatically

```bash
# Create a test order
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "1234567890",
            "phone_number_id": "PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": {
              "name": "Test User"
            },
            "wa_id": "1234567890"
          }],
          "messages": [{
            "from": "1234567890",
            "id": "wamid.test123",
            "timestamp": "1234567890",
            "type": "text",
            "text": {
              "body": "menu"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### 1.4 View All Orders

```bash
curl http://localhost:3000/whatsapp/orders
```

### 1.5 Get Order by Phone Number

```bash
curl http://localhost:3000/whatsapp/orders/phone/1234567890
```

### 1.6 Update Order Status

```bash
curl -X PUT http://localhost:3000/whatsapp/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

### 1.7 Cancel Order

```bash
curl -X PUT http://localhost:3000/whatsapp/orders/1/cancel
```

---

## Method 2: Mock Webhook Testing (No Meta Account Needed)

Test the conversation flow by sending simulated WhatsApp messages.

### 2.1 Setup Test Script

Create a file `test-whatsapp.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000/whatsapp/webhook"
PHONE="255712345678"

# Function to send message
send_message() {
  local message="$1"
  local msg_id="wamid.test_$(date +%s)"

  curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"object\": \"whatsapp_business_account\",
      \"entry\": [{
        \"id\": \"test_business_account\",
        \"changes\": [{
          \"value\": {
            \"messaging_product\": \"whatsapp\",
            \"metadata\": {
              \"display_phone_number\": \"255700000000\",
              \"phone_number_id\": \"test_phone_id\"
            },
            \"contacts\": [{
              \"profile\": {
                \"name\": \"Test Customer\"
              },
              \"wa_id\": \"$PHONE\"
            }],
            \"messages\": [{
              \"from\": \"$PHONE\",
              \"id\": \"$msg_id\",
              \"timestamp\": \"$(date +%s)\",
              \"type\": \"text\",
              \"text\": {
                \"body\": \"$message\"
              }
            }]
          },
          \"field\": \"messages\"
        }]
      }]
    }"

  echo ""
  sleep 1
}

# Function to send interactive message (button/list selection)
send_interactive() {
  local choice_id="$1"
  local msg_id="wamid.test_$(date +%s)"

  curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"object\": \"whatsapp_business_account\",
      \"entry\": [{
        \"id\": \"test_business_account\",
        \"changes\": [{
          \"value\": {
            \"messaging_product\": \"whatsapp\",
            \"metadata\": {
              \"display_phone_number\": \"255700000000\",
              \"phone_number_id\": \"test_phone_id\"
            },
            \"contacts\": [{
              \"profile\": {
                \"name\": \"Test Customer\"
              },
              \"wa_id\": \"$PHONE\"
            }],
            \"messages\": [{
              \"from\": \"$PHONE\",
              \"id\": \"$msg_id\",
              \"timestamp\": \"$(date +%s)\",
              \"type\": \"interactive\",
              \"interactive\": {
                \"type\": \"list_reply\",
                \"list_reply\": {
                  \"id\": \"$choice_id\",
                  \"title\": \"Test Selection\"
                }
              }
            }]
          },
          \"field\": \"messages\"
        }]
      }]
    }"

  echo ""
  sleep 1
}

# Test conversation flow
echo "=== Testing WhatsApp Chatbot ==="
echo ""

echo "1. Sending 'Hi' to trigger main menu..."
send_message "Hi"

echo "2. Selecting 'Search by Code'..."
send_interactive "search_by_code"

echo "3. Entering product code 'TEST001'..."
send_message "TEST001"

echo "4. Entering quantity '2'..."
send_message "2"

echo "5. Selecting 'Checkout'..."
send_interactive "checkout"

echo "6. Entering delivery address..."
send_message "Dar es Salaam, Kinondoni"

echo "7. Confirming order..."
send_interactive "confirm_order"

echo ""
echo "=== Test Complete ==="
echo "Check your application logs for responses!"
```

### 2.2 Run Test Script

```bash
chmod +x test-whatsapp.sh
./test-whatsapp.sh
```

### 2.3 Monitor Application Logs

Watch your NestJS application logs to see the bot's responses:

```bash
# In another terminal
npm run start:dev
```

You should see logs like:
```
[MessageHandlerService] Processing message from 255712345678
[WhatsAppApiService] Sending message: {...}
```

---

## Method 3: Local WhatsApp Testing (Full Integration)

Test with real WhatsApp messages using ngrok.

### 3.1 Prerequisites

1. **Meta Developer Account**: https://developers.facebook.com/
2. **WhatsApp Business App** configured
3. **ngrok** installed: https://ngrok.com/download
4. **Environment variables** set in `.env`

### 3.2 Setup Steps

#### Step 1: Start Your Application

```bash
npm run start:dev
```

#### Step 2: Start ngrok

In a new terminal:

```bash
ngrok http 3000
```

You'll get output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

Copy the `https://` URL.

#### Step 3: Configure Webhook in Meta

1. Go to **Meta for Developers** → Your App → **WhatsApp** → **Configuration**
2. Click **Edit** next to Webhook
3. Enter:
   - **Callback URL**: `https://abc123.ngrok.io/whatsapp/webhook`
   - **Verify Token**: Value from your `.env` file (`WHATSAPP_VERIFY_TOKEN`)
4. Click **Verify and Save**
5. Subscribe to `messages` field

#### Step 4: Add Test Phone Number

1. In Meta Dashboard → **WhatsApp** → **API Setup**
2. Under **"To"** section, click **"Manage phone number list"**
3. Add your phone number
4. You'll receive a verification code on WhatsApp

#### Step 5: Send Test Messages

From your phone, send a message to the WhatsApp Business number.

### 3.3 Test Scenarios

#### Scenario 1: Browse Products by Category

```
You: Hi
Bot: [Shows main menu with 5 options]

You: [Select "📂 Browse Categories"]
Bot: [Shows list of categories]

You: [Select a category, e.g., "Electronics"]
Bot: [Shows items in that category]

You: [Select an item]
Bot: [Shows item details, asks for quantity]

You: 2
Bot: [Confirms item added to cart]
```

#### Scenario 2: Search by Product Code

```
You: Hi
Bot: [Shows main menu]

You: [Select "🔢 Search by Code"]
Bot: Please enter the product code

You: TEST001
Bot: ✅ Product Found!
     📦 Product Name
     🔢 Code: TEST001
     💰 Price: TZS 50,000
     📊 Available: 100 units

     Please enter the quantity...

You: 5
Bot: ✅ Added 5 x Product Name to your cart!
```

#### Scenario 3: Complete Order Flow

```
You: Hi
Bot: [Main menu]

You: [Search and add items to cart]

You: [Select "🛒 View Cart"]
Bot: [Shows cart with items and total]

You: [Select "Checkout"]
Bot: 📍 Please enter your delivery address

You: Dar es Salaam, Kinondoni, House #123
Bot: [Shows order summary]

You: [Select "✅ Confirm"]
Bot: ✅ Order Confirmed!
     Order #WA2510210001
     Total: TZS 100,000
```

#### Scenario 4: Order Tracking

```
You: [Select "📦 Track Order"]
Bot: [Shows list of your orders]

You: [Select an order]
Bot: [Shows order details with status]
```

#### Scenario 5: Error Handling

```
You: [Select "🔢 Search by Code"]
Bot: Please enter the product code

You: INVALID999
Bot: ❌ No product found with code "INVALID999"
```

### 3.4 Check Logs

Monitor your application logs to see all interactions:

```bash
# Your application should show:
[WhatsAppController] Received webhook: {...}
[MessageHandlerService] Processing message from +255712345678
[WhatsAppApiService] Sending message: {...}
[SessionService] Created new session for +255712345678
[WhatsAppOrderService] Creating order for +255712345678
[WhatsAppOrderService] Order created successfully: WA2510210001
```

---

## Method 4: Database Verification

Verify that data is being saved correctly.

### 4.1 Check Sessions

```sql
SELECT * FROM core.whatsapp_sessions
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- One session per phone number
- `state` shows current conversation state
- `context` contains cart data (JSON)

### 4.2 Check Orders

```sql
SELECT
  id,
  order_number,
  customer_phone,
  total_amount,
  status,
  created_at
FROM core.whatsapp_orders
ORDER BY created_at DESC
LIMIT 10;
```

### 4.3 Check Order Items

```sql
SELECT
  wo.order_number,
  i.name as item_name,
  woi.quantity,
  woi.unit_price,
  woi.total_price
FROM core.whatsapp_order_items woi
JOIN core.whatsapp_orders wo ON woi.order_id = wo.id
JOIN core.item i ON woi.item_id = i.id
ORDER BY wo.created_at DESC
LIMIT 20;
```

### 4.4 Verify Stock Deduction

```sql
-- Check stock before and after order
SELECT
  i.name,
  i.code,
  ist.quantity as current_stock
FROM core.item i
JOIN core.item_stock ist ON ist.item_id = i.id
WHERE i.code = 'TEST001';
```

### 4.5 Check Auto-Created Customers

```sql
SELECT * FROM core.customer
WHERE phone LIKE '%255712345678%'
ORDER BY created_at DESC;
```

---

## 🧪 Testing Checklist

### Backend API Tests
- [ ] GET `/whatsapp/stats/orders` returns correct statistics
- [ ] GET `/whatsapp/orders` returns all orders
- [ ] GET `/whatsapp/orders/:id` returns specific order
- [ ] GET `/whatsapp/orders/phone/:phone` returns customer orders
- [ ] PUT `/whatsapp/orders/:id/status` updates order status
- [ ] PUT `/whatsapp/orders/:id/cancel` cancels order and restores stock

### Webhook Tests
- [ ] GET `/whatsapp/webhook` verification works
- [ ] POST `/whatsapp/webhook` receives messages
- [ ] Invalid webhook token is rejected
- [ ] Malformed payloads are handled gracefully

### Conversation Flow Tests
- [ ] Main menu displays with 5 options
- [ ] Browse categories shows all categories
- [ ] Selecting category shows items
- [ ] Product name search works
- [ ] Product code search works (case-insensitive)
- [ ] Invalid product code shows error
- [ ] Adding to cart succeeds
- [ ] Cart displays correctly
- [ ] Cart persists across messages
- [ ] Checkout flow completes
- [ ] Order confirmation message sent
- [ ] Order tracking shows history

### Business Logic Tests
- [ ] Stock validation prevents over-ordering
- [ ] Stock is deducted on order confirmation
- [ ] Order cancellation restores stock
- [ ] Customer is auto-created from phone number
- [ ] Order number generation is unique
- [ ] Total amount calculation is correct
- [ ] Multiple items in cart are handled
- [ ] Empty cart is handled

### Session Management Tests
- [ ] Session is created for new phone number
- [ ] Session persists across messages
- [ ] Session state transitions correctly
- [ ] Cart data is stored in session
- [ ] Global commands (menu, help, cancel) work in any state

---

## 🔍 Debugging Tips

### 1. Enable Detailed Logging

Set logging to true in TypeORM:

```typescript
// app.module.ts
TypeOrmModule.forRoot({
  // ...
  logging: true,  // Change to true
})
```

### 2. Check WhatsApp API Logs

Add more detailed logging in `whatsapp-api.service.ts`:

```typescript
this.logger.debug(`Sending message to ${to}: ${JSON.stringify(payload)}`);
```

### 3. Monitor ngrok Requests

Visit: http://localhost:4040

This shows all HTTP requests going through ngrok in real-time.

### 4. Check Meta Webhook Logs

In Meta Developer Dashboard:
- Go to **WhatsApp** → **Configuration** → **Webhook**
- View recent deliveries and responses

### 5. Use Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "WhatsApp Chatbot API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Order Stats",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/whatsapp/stats/orders"
      }
    },
    {
      "name": "Get All Orders",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/whatsapp/orders"
      }
    },
    {
      "name": "Get Orders by Phone",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/whatsapp/orders/phone/255712345678"
      }
    }
  ]
}
```

---

## 📊 Sample Test Data

### Create Test Items

```sql
-- Insert test items with codes
INSERT INTO core.item (name, code, desc) VALUES
  ('Test Laptop', 'LAPTOP001', 'High-performance laptop'),
  ('Test Mouse', 'MOUSE042', 'Wireless mouse'),
  ('Test Keyboard', 'KEYB055', 'Mechanical keyboard');

-- Add prices
INSERT INTO core.item_price (item_id, purchase_amount, freight_amount, selling_price, is_active)
SELECT id, 1000000, 50000, 1500000, true FROM core.item WHERE code = 'LAPTOP001';

INSERT INTO core.item_price (item_id, purchase_amount, freight_amount, selling_price, is_active)
SELECT id, 15000, 5000, 25000, true FROM core.item WHERE code = 'MOUSE042';

-- Add stock
INSERT INTO core.item_stock (item_id, warehouse_id, quantity, reorder_point)
SELECT id, 1, 100, 10 FROM core.item WHERE code = 'LAPTOP001';

INSERT INTO core.item_stock (item_id, warehouse_id, quantity, reorder_point)
SELECT id, 1, 500, 50 FROM core.item WHERE code = 'MOUSE042';
```

---

## ✅ Success Criteria

Your implementation is working correctly if:

1. ✅ Application starts without errors
2. ✅ Webhook verification succeeds
3. ✅ Bot responds to messages
4. ✅ Main menu displays correctly (5 options)
5. ✅ Product code search finds items
6. ✅ Cart persists across conversations
7. ✅ Orders are created successfully
8. ✅ Stock is deducted correctly
9. ✅ Orders appear in database
10. ✅ Order tracking shows order history

---

## 🆘 Common Issues & Solutions

### Issue: Webhook verification fails

**Solution:**
- Check `WHATSAPP_VERIFY_TOKEN` matches in `.env` and Meta Dashboard
- Ensure webhook URL is accessible (check ngrok is running)

### Issue: Bot doesn't respond

**Solution:**
- Check application logs for errors
- Verify `WHATSAPP_ACCESS_TOKEN` is valid
- Ensure `WHATSAPP_PHONE_NUMBER_ID` is correct
- Check webhook subscription includes `messages` field

### Issue: Product code search doesn't work

**Solution:**
- Verify items have `code` field populated
- Check item codes in database: `SELECT id, name, code FROM core.item;`
- Ensure search is case-insensitive working

### Issue: Stock not deducting

**Solution:**
- Check item has stock in `item_stock` table
- Verify warehouse ID is correct (default: 1)
- Check logs for stock update errors

### Issue: Customer not auto-created

**Solution:**
- Check CustomerService is working
- Verify phone number format
- Check database for customer with that phone

---

## 🎉 Conclusion

You now have multiple ways to test your WhatsApp chatbot:

1. **Quick API tests** - Fastest for backend validation
2. **Mock webhook tests** - No Meta account needed
3. **Full WhatsApp integration** - Complete end-to-end testing
4. **Database verification** - Confirm data integrity

Start with Method 1 and 2 for quick testing, then move to Method 3 for full integration testing before going live!
