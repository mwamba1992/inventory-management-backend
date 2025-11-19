-- Fix duplicate phone number in customer table
-- This will delete the duplicate customer record with ID 27

-- Check current duplicates
SELECT phone, COUNT(*) as count
FROM core.customer
GROUP BY phone
HAVING COUNT(*) > 1;

-- Show the duplicate records
SELECT id, name, phone, "createdAt", "hasPassword"
FROM core.customer
WHERE phone = '255753107301'
ORDER BY "createdAt";

-- Delete the newer duplicate (ID 27 - jo_delems)
-- Keep the older one (ID 5 - JOEL M GAITAN)
DELETE FROM core.customer WHERE id = 27;

-- Verify deletion
SELECT phone, COUNT(*) as count
FROM core.customer
GROUP BY phone
HAVING COUNT(*) > 1;

-- Now the unique constraint can be applied successfully
