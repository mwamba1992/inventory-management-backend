# WhatsApp Chatbot Ordering System - Setup Guide

This guide will help you set up the WhatsApp Cloud API integration for the inventory management system.

## 📋 Prerequisites

1. **Meta Business Account**: https://business.facebook.com/
2. **Meta Developer Account**: https://developers.facebook.com/
3. **WhatsApp Business App** (optional, for testing)

## 🚀 Step 1: Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details:
   - App Name: e.g., "Inventory Management Bot"
   - Contact Email: Your email
   - Business Account: Select your business account
5. Click **"Create App"**

## 📱 Step 2: Add WhatsApp Product

1. In your app dashboard, find **"WhatsApp"** in the products list
2. Click **"Set Up"**
3. Select or create a **Meta Business Account**
4. Complete the setup wizard

## 🔑 Step 3: Get API Credentials

### Phone Number ID
1. Go to **WhatsApp** → **API Setup**
2. Under **"From"** section, you'll see a phone number
3. Copy the **Phone Number ID** (not the phone number itself)
4. Add to `.env` file: `WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id`

### Access Token
1. In the same API Setup page, find **"Temporary access token"**
2. For **production**, generate a **permanent token**:
   - Go to **Business Settings** → **System Users**
   - Create a system user
   - Generate token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions
3. Add to `.env` file: `WHATSAPP_ACCESS_TOKEN=your_access_token`

### Verify Token
1. Create your own custom verification token (any random string)
2. Add to `.env` file: `WHATSAPP_VERIFY_TOKEN=my_secret_verify_token_12345`

## 🌐 Step 4: Set Up Webhook

### Option A: Using ngrok (for local development)

1. Install ngrok: https://ngrok.com/download
2. Start your NestJS app:
   ```bash
   npm run start:dev
   ```
3. In a new terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Option B: Deploy to Production Server

Deploy your app to a server with HTTPS enabled (required by WhatsApp).

### Configure Webhook in Meta

1. Go to **WhatsApp** → **Configuration** in your Meta App
2. Click **"Edit"** in the Webhook section
3. Enter your webhook details:
   - **Callback URL**: `https://your-domain.com/whatsapp/webhook`
   - **Verify Token**: The same token you set in `.env` file
4. Click **"Verify and Save"**
5. Subscribe to webhook fields:
   - ✅ `messages`
   - ✅ `message_status` (optional)

## ✅ Step 5: Test the Integration

### Send a Test Message

1. Use the test phone number provided by Meta
2. Send a WhatsApp message to your business number
3. You should receive an automated response with the main menu

### Test Messages to Try:
- "menu" - Show main menu
- "help" - Show help information
- "cart" - View shopping cart
- "track" - Track orders

## 📊 Step 6: Monitor Webhooks

### Check Webhook Logs
In your app logs, you should see:
```
[WhatsAppController] Webhook verified successfully
[WhatsAppController] Received webhook: {...}
[MessageHandlerService] Processing message from +1234567890
```

### Common Issues

#### Webhook Verification Failed
- Ensure `WHATSAPP_VERIFY_TOKEN` matches exactly in both `.env` and Meta webhook config
- Check that your server is accessible via HTTPS
- Verify the webhook URL is correct

#### Messages Not Received
- Check webhook subscription fields include `messages`
- Verify access token has correct permissions
- Check app logs for errors

#### Cannot Send Messages
- Verify `WHATSAPP_ACCESS_TOKEN` is valid
- Check `WHATSAPP_PHONE_NUMBER_ID` is correct
- Ensure test phone number is added in Meta dashboard (for testing)

## 🎯 Step 7: Add Test Phone Numbers (Development)

1. Go to **WhatsApp** → **API Setup**
2. Scroll to **"To"** section
3. Click **"Manage phone number list"**
4. Add phone numbers you want to test with
5. Each number will receive a verification code via WhatsApp

## 🔐 Step 8: Production Deployment Checklist

- [ ] Use permanent access token (not temporary)
- [ ] Set up system user with appropriate permissions
- [ ] Configure webhook on production domain with HTTPS
- [ ] Remove test mode restrictions
- [ ] Verify business verification status
- [ ] Set up message templates for notifications (optional)
- [ ] Configure rate limits and quotas
- [ ] Set up monitoring and logging
- [ ] Test all conversation flows
- [ ] Add error handling for common scenarios
- [ ] Add product codes to all inventory items (NEW!)
- [ ] Test product code search functionality (NEW!)

## 📚 API Endpoints

### Webhook Endpoints
- **GET** `/whatsapp/webhook` - Webhook verification
- **POST** `/whatsapp/webhook` - Receive messages from WhatsApp

### Order Management Endpoints
- **GET** `/whatsapp/orders` - Get all WhatsApp orders
- **GET** `/whatsapp/orders/:id` - Get order by ID
- **GET** `/whatsapp/orders/phone/:phone` - Get orders by phone number
- **PUT** `/whatsapp/orders/:id/status` - Update order status
- **PUT** `/whatsapp/orders/:id/cancel` - Cancel order
- **GET** `/whatsapp/stats/orders` - Get order statistics

## 🤖 Chatbot Features

### Menu Navigation
The bot uses interactive buttons and lists for easy navigation:
- 📂 Browse Categories
- 🔍 Search Products
- 🔢 Search by Code (NEW!)
- 🛒 View Cart
- 📦 Track Orders

### Ordering Flow
1. User selects a category, searches for products, or enters a product code
2. User selects an item (or item is found directly via code)
3. User enters quantity
4. Item added to cart
5. User proceeds to checkout
6. User enters delivery address
7. User confirms order
8. Order created and confirmation sent

### Product Code Search (NEW!)
- Direct product lookup by entering product code
- Case-insensitive exact match search
- Shows full product details (name, code, price, stock, description)
- Faster ordering for customers who know product codes
- Perfect for repeat orders and catalog-based shopping

### Session Management
- Each user has a persistent session
- Cart persists across conversations
- State-based conversation flow
- Support for multiple concurrent users

## 🔧 Environment Variables Reference

```env
# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

# Database (for WhatsApp tables)
DB_HOST=your_db_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=inventorydb

# Application
PORT=3000
```

## 📖 Additional Resources

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Platform](https://business.whatsapp.com/)
- [Meta for Developers](https://developers.facebook.com/)
- [ngrok Documentation](https://ngrok.com/docs)

## 🆘 Support & Troubleshooting

### Enable Debug Logging
Set `logging: true` in TypeORM configuration to see database queries.

### Check WhatsApp API Status
Visit: https://developers.facebook.com/status/dashboard/

### Test Webhook Locally
```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d @test-webhook-payload.json
```

### View Order Statistics
```bash
curl http://localhost:3000/whatsapp/stats/orders
```

## 🎉 Success!

Once everything is set up, customers can:
1. Message your WhatsApp Business number
2. Browse products by category
3. Search for specific items by name
4. Search for products by product code (NEW!)
5. Check stock availability
6. Add items to cart
7. Place orders
8. Track order status
9. Receive order confirmations

All orders are automatically integrated with your inventory system, updating stock levels in real-time!

### 🔢 Product Code Setup (Required for Code Search)

To enable the product code search feature:

1. **Start the application** - The `code` field will be auto-created in the `item` table
2. **Add product codes** to your items:
   ```sql
   UPDATE core.item SET code = 'LAPTOP001' WHERE id = 1;
   UPDATE core.item SET code = 'MOUSE042' WHERE id = 2;
   -- etc...
   ```
3. **Code format recommendations**:
   - Keep it short (5-10 characters): `PROD001`, `ELEC-045`
   - Use uppercase for consistency
   - Include category prefix for organization (optional)
   - Avoid confusing characters (0 vs O, 1 vs I)

4. **Use product codes in**:
   - Printed catalogs
   - Product labels/stickers
   - Email/SMS marketing campaigns
   - Customer repeat orders

See `WHATSAPP_CODE_SEARCH_FEATURE.md` for detailed setup instructions and best practices.
