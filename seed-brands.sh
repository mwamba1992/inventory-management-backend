#!/bin/bash

# Seed Famous Brands Script
# Usage: ./seed-brands.sh [API_URL]
# Example: ./seed-brands.sh https://business.mwendavano.com/api

API_URL="${1:-https://business.mwendavano.com/api}"

echo "Seeding brands to: $API_URL"
echo "================================"

# Electronics Brands
curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Samsung","description":"Samsung Electronics - Consumer electronics, mobile devices, and home appliances"}' && echo "✓ Samsung added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Apple","description":"Apple Inc. - Premium consumer electronics, computers, and software"}' && echo "✓ Apple added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Sony","description":"Sony Corporation - Electronics, gaming consoles, and entertainment"}' && echo "✓ Sony added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"LG","description":"LG Electronics - Home appliances, TVs, and mobile devices"}' && echo "✓ LG added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Microsoft","description":"Microsoft Corporation - Software, computers, and gaming"}' && echo "✓ Microsoft added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Dell","description":"Dell Technologies - Computers, laptops, and IT solutions"}' && echo "✓ Dell added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"HP","description":"HP Inc. - Computers, printers, and office equipment"}' && echo "✓ HP added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Lenovo","description":"Lenovo Group - Laptops, desktops, and technology solutions"}' && echo "✓ Lenovo added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Asus","description":"ASUSTek Computer - Computer hardware, laptops, and peripherals"}' && echo "✓ Asus added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Acer","description":"Acer Inc. - Laptops, monitors, and computer accessories"}' && echo "✓ Acer added"

# Fashion & Apparel Brands
curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Nike","description":"Nike Inc. - Athletic footwear, apparel, and equipment"}' && echo "✓ Nike added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Adidas","description":"Adidas AG - Sports shoes, clothing, and accessories"}' && echo "✓ Adidas added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Puma","description":"Puma SE - Athletic and casual footwear and apparel"}' && echo "✓ Puma added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Under Armour","description":"Under Armour Inc. - Performance athletic wear"}' && echo "✓ Under Armour added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Zara","description":"Zara - Fashion retail clothing and accessories"}' && echo "✓ Zara added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"H&M","description":"H&M - Fashion and quality at affordable prices"}' && echo "✓ H&M added"

# Home & Kitchen Brands
curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Philips","description":"Philips - Health technology, lighting, and home appliances"}' && echo "✓ Philips added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Panasonic","description":"Panasonic Corporation - Consumer electronics and appliances"}' && echo "✓ Panasonic added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Whirlpool","description":"Whirlpool Corporation - Home appliances and kitchen equipment"}' && echo "✓ Whirlpool added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Bosch","description":"Bosch - Power tools, home appliances, and automotive parts"}' && echo "✓ Bosch added"

# Automotive Brands
curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Toyota","description":"Toyota Motor Corporation - Automotive manufacturer"}' && echo "✓ Toyota added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Honda","description":"Honda Motor Company - Automobiles and motorcycles"}' && echo "✓ Honda added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Ford","description":"Ford Motor Company - American automotive manufacturer"}' && echo "✓ Ford added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"BMW","description":"BMW - Luxury vehicles and motorcycles"}' && echo "✓ BMW added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Mercedes-Benz","description":"Mercedes-Benz - Luxury automobiles"}' && echo "✓ Mercedes-Benz added"

# Food & Beverage Brands
curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Coca-Cola","description":"The Coca-Cola Company - Beverages"}' && echo "✓ Coca-Cola added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Pepsi","description":"PepsiCo - Food and beverages"}' && echo "✓ Pepsi added"

curl -s -X POST "$API_URL/brands" -H "Content-Type: application/json" -d '{"name":"Nestlé","description":"Nestlé - Food and beverage products"}' && echo "✓ Nestlé added"

echo "================================"
echo "✅ All brands seeded successfully!"
echo ""
echo "To verify, visit: $API_URL/brands"
