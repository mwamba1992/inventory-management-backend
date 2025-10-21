#!/bin/bash

# WhatsApp API Quick Test Script
# Tests the WhatsApp endpoints without needing Meta/WhatsApp setup

API_URL="http://localhost:3000"

echo "========================================="
echo "WhatsApp Chatbot API Testing"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Get Order Statistics
echo -e "${BLUE}Test 1: Get Order Statistics${NC}"
echo "GET /whatsapp/stats/orders"
curl -s $API_URL/whatsapp/stats/orders | jq '.'
echo ""
echo ""

# Test 2: Get All Orders
echo -e "${BLUE}Test 2: Get All WhatsApp Orders${NC}"
echo "GET /whatsapp/orders"
curl -s $API_URL/whatsapp/orders | jq '.'
echo ""
echo ""

# Test 3: Simulate incoming message (Main Menu)
echo -e "${BLUE}Test 3: Simulate WhatsApp Message - 'Hi'${NC}"
echo "POST /whatsapp/webhook"
curl -s -X POST $API_URL/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test_business_account",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "255700000000",
            "phone_number_id": "test_phone_id"
          },
          "contacts": [{
            "profile": {
              "name": "Test Customer"
            },
            "wa_id": "255712345678"
          }],
          "messages": [{
            "from": "255712345678",
            "id": "wamid.test_001",
            "timestamp": "'$(date +%s)'",
            "type": "text",
            "text": {
              "body": "Hi"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }' | jq '.'
echo ""
echo ""

# Test 4: Check if session was created
echo -e "${BLUE}Test 4: Verify Session Created${NC}"
echo "Check your database:"
echo "SELECT * FROM core.whatsapp_sessions WHERE phone_number = '255712345678';"
echo ""

# Test 5: Search by product code
echo -e "${BLUE}Test 5: Simulate Product Code Search${NC}"
echo "First, ensure you have an item with code 'TEST001'"
echo "Then simulate: User selects 'Search by Code'"
curl -s -X POST $API_URL/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test_business_account",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "255700000000",
            "phone_number_id": "test_phone_id"
          },
          "contacts": [{
            "profile": {
              "name": "Test Customer"
            },
            "wa_id": "255712345678"
          }],
          "messages": [{
            "from": "255712345678",
            "id": "wamid.test_002",
            "timestamp": "'$(date +%s)'",
            "type": "interactive",
            "interactive": {
              "type": "list_reply",
              "list_reply": {
                "id": "search_by_code",
                "title": "Search by Code"
              }
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }' | jq '.'
echo ""
echo ""

# Test 6: Enter product code
sleep 2
echo -e "${BLUE}Test 6: Enter Product Code 'TEST001'${NC}"
curl -s -X POST $API_URL/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test_business_account",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "255700000000",
            "phone_number_id": "test_phone_id"
          },
          "contacts": [{
            "profile": {
              "name": "Test Customer"
            },
            "wa_id": "255712345678"
          }],
          "messages": [{
            "from": "255712345678",
            "id": "wamid.test_003",
            "timestamp": "'$(date +%s)'",
            "type": "text",
            "text": {
              "body": "TEST001"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }' | jq '.'
echo ""
echo ""

echo -e "${GREEN}========================================="
echo "Testing Complete!"
echo "=========================================${NC}"
echo ""
echo "Next Steps:"
echo "1. Check your application logs for bot responses"
echo "2. Check database: SELECT * FROM core.whatsapp_sessions;"
echo "3. Check database: SELECT * FROM core.whatsapp_orders;"
echo ""
echo "For full WhatsApp testing with real messages:"
echo "1. Set up ngrok: ngrok http 3000"
echo "2. Configure webhook in Meta Developer Console"
echo "3. Send messages from WhatsApp"
echo ""
