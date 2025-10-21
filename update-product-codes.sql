-- ==========================================
-- Product Code Update Script
-- ==========================================
-- This script updates all existing items with systematic product codes
-- Format: PROD-001, PROD-002, PROD-003, etc.
--
-- IMPORTANT:
-- 1. Backup your database before running this script
-- 2. Review the generated codes before executing
-- 3. Adjust the format or starting number as needed
-- ==========================================

-- Step 1: Add a temporary sequence column to help with numbering
-- This will be used to generate sequential codes
ALTER TABLE core.items ADD COLUMN IF NOT EXISTS temp_sequence SERIAL;

-- Step 2: Update all items without codes using the sequence
-- Format: PROD-XXX where XXX is a zero-padded 3-digit number
UPDATE core.items
SET code = CONCAT('PROD-', LPAD(temp_sequence::TEXT, 3, '0'))
WHERE code IS NULL OR code = '';

-- Step 3: Remove the temporary sequence column
ALTER TABLE core.items DROP COLUMN IF EXISTS temp_sequence;

-- Step 4: Verify the results
SELECT id, name, code, created_at
FROM core.items
ORDER BY code;

-- ==========================================
-- ALTERNATIVE: Category-Based Product Codes
-- ==========================================
-- If you want to use category-based codes (e.g., ELEC-001, FOOD-001),
-- uncomment and modify the script below:

/*
-- First, let's see what categories exist
SELECT DISTINCT c.name, c.code
FROM core.common c
WHERE c.type = 'category'
ORDER BY c.name;

-- Create category-based codes
-- This example assumes categories have a 'code' field
WITH item_categories AS (
  SELECT
    i.id,
    i.name,
    c.code as category_code,
    ROW_NUMBER() OVER (PARTITION BY c.code ORDER BY i.created_at) as seq
  FROM core.items i
  LEFT JOIN core.common c ON i.category_id = c.id
)
UPDATE core.items i
SET code = CONCAT(
  COALESCE(ic.category_code, 'MISC'),
  '-',
  LPAD(ic.seq::TEXT, 3, '0')
)
FROM item_categories ic
WHERE i.id = ic.id
  AND (i.code IS NULL OR i.code = '');
*/

-- ==========================================
-- ROLLBACK (if needed)
-- ==========================================
-- If you need to rollback the changes, uncomment below:

/*
UPDATE core.items
SET code = NULL
WHERE code LIKE 'PROD-%';
*/

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check for duplicate codes (should return 0 rows)
SELECT code, COUNT(*) as count
FROM core.items
WHERE code IS NOT NULL
GROUP BY code
HAVING COUNT(*) > 1;

-- Check items without codes (should return 0 rows after update)
SELECT id, name
FROM core.items
WHERE code IS NULL OR code = '';

-- Count total items with codes
SELECT
  COUNT(*) as total_items,
  COUNT(code) as items_with_codes,
  COUNT(*) - COUNT(code) as items_without_codes
FROM core.items;
