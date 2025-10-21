# Product Code Update Guide

This guide explains how to update all existing products with systematic product codes.

## Overview

The `update-product-codes.sql` script assigns unique product codes to all items in your inventory database using the format `PROD-XXX` where XXX is a zero-padded 3-digit sequential number.

## Code Format

**Default Format**: `PROD-001`, `PROD-002`, `PROD-003`, etc.

**Alternative Formats** (commented in the SQL file):
- Category-based: `ELEC-001`, `FOOD-001`, `CLTH-001`
- Custom prefix: Modify the `CONCAT()` function in the script

## Prerequisites

1. **Backup your database first!**
   ```bash
   pg_dump -U your_username -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. Ensure you have database admin access
3. Review the script before execution

## Execution Methods

### Method 1: Using psql Command Line

```bash
# Connect to your database
psql -U your_username -d your_database

# Execute the script
\i update-product-codes.sql

# Or in one command
psql -U your_username -d your_database -f update-product-codes.sql
```

### Method 2: Using Database GUI (pgAdmin, DBeaver, etc.)

1. Open your database management tool
2. Connect to your database
3. Open the `update-product-codes.sql` file
4. Execute the script
5. Review the verification queries at the end

### Method 3: Using Environment Variables (Recommended)

```bash
# Load your .env file or set these variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export DB_NAME=your_database

# Execute the script
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -f update-product-codes.sql
```

## Script Workflow

The script performs these steps:

1. **Adds temporary sequence column** - Creates a sequential number for each item
2. **Updates codes** - Assigns product codes based on the sequence
3. **Removes temporary column** - Cleans up the helper column
4. **Verifies results** - Runs validation queries

## Verification

After running the script, verify the results:

```sql
-- Check all product codes
SELECT id, name, code, created_at
FROM core.items
ORDER BY code;

-- Verify no duplicates
SELECT code, COUNT(*) as count
FROM core.items
WHERE code IS NOT NULL
GROUP BY code
HAVING COUNT(*) > 1;

-- Count items with codes
SELECT
  COUNT(*) as total_items,
  COUNT(code) as items_with_codes,
  COUNT(*) - COUNT(code) as items_without_codes
FROM core.items;
```

## Customization Options

### Option 1: Different Starting Number

Modify line 16 in the SQL file:
```sql
-- Start from 100 instead of 1
UPDATE core.items
SET code = CONCAT('PROD-', LPAD((temp_sequence + 99)::TEXT, 3, '0'))
WHERE code IS NULL OR code = '';
```

### Option 2: Different Prefix

```sql
-- Use 'ITEM-' instead of 'PROD-'
UPDATE core.items
SET code = CONCAT('ITEM-', LPAD(temp_sequence::TEXT, 3, '0'))
WHERE code IS NULL OR code = '';
```

### Option 3: 4-Digit Codes

```sql
-- Use PROD-0001 format
UPDATE core.items
SET code = CONCAT('PROD-', LPAD(temp_sequence::TEXT, 4, '0'))
WHERE code IS NULL OR code = '';
```

### Option 4: Category-Based Codes

Uncomment the "ALTERNATIVE: Category-Based Product Codes" section in the SQL file. This will create codes like:
- Electronics: `ELEC-001`, `ELEC-002`
- Food: `FOOD-001`, `FOOD-002`
- Clothing: `CLTH-001`, `CLTH-002`

## Rollback

If you need to undo the changes:

```sql
-- Remove all PROD-XXX codes
UPDATE core.items
SET code = NULL
WHERE code LIKE 'PROD-%';
```

Or restore from your backup:
```bash
psql -U your_username -d your_database < backup_YYYYMMDD_HHMMSS.sql
```

## Testing with WhatsApp Chatbot

After updating product codes, test the search functionality:

1. Start the application:
   ```bash
   npm run start:dev
   ```

2. Use the `whatsapp-api.http` file to test:
   - Test #4: Enter product code "PROD-001"
   - Verify the product is found
   - Check stock and price information

3. Test with real WhatsApp (if configured):
   - Send "Hi" to your WhatsApp bot
   - Select "Search by Code"
   - Enter "PROD-001"
   - Verify product details are displayed

## Common Issues

### Issue 1: Unique Constraint Violation

**Error**: `duplicate key value violates unique constraint "items_code_key"`

**Solution**: There are existing duplicate codes. Find and fix them first:
```sql
SELECT code, COUNT(*)
FROM core.items
WHERE code IS NOT NULL
GROUP BY code
HAVING COUNT(*) > 1;
```

### Issue 2: Permission Denied

**Error**: `permission denied for table items`

**Solution**: Ensure you're using a database user with UPDATE privileges:
```sql
GRANT UPDATE ON core.items TO your_username;
```

### Issue 3: Sequence Already Exists

**Error**: `column "temp_sequence" already exists`

**Solution**: Drop the column first:
```sql
ALTER TABLE core.items DROP COLUMN IF EXISTS temp_sequence;
```

## Best Practices

1. **Always backup first** - You can't stress this enough
2. **Test on development environment** - Run the script on a copy of your database first
3. **Review generated codes** - Check the verification query results before committing
4. **Document your format** - If you customize the code format, document it for your team
5. **Update in batches** - For very large databases (100k+ items), consider updating in batches

## Next Steps

After updating product codes:

1. ✅ Verify all products have codes (run verification queries)
2. ✅ Test the WhatsApp chatbot code search feature
3. ✅ Update any documentation with example product codes
4. ✅ Train staff on the new product code system
5. ✅ Consider printing product code labels/stickers for physical inventory

## Example Product Codes

Based on the default format, your products will have codes like:

```
PROD-001 - Laptop Dell XPS 15
PROD-002 - iPhone 13 Pro
PROD-003 - Samsung Galaxy S21
PROD-004 - Sony WH-1000XM4 Headphones
...
```

## Support

If you encounter issues:
1. Check the Common Issues section above
2. Review the verification queries in the SQL file
3. Check application logs: `npm run start:dev`
4. Verify database schema: `\d core.items` in psql
