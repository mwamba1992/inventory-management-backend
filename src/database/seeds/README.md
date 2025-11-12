# Database Seeding

This directory contains seed data and scripts to initialize your database with common data.

## Available Seeds

### Color Categories Seed

Seeds 30 common colors into the database for use with item stock distributions.

**Included Colors:**
1. Black (#000000)
2. White (#FFFFFF)
3. Red (#FF0000)
4. Blue (#0000FF)
5. Green (#00FF00)
6. Yellow (#FFFF00)
7. Orange (#FFA500)
8. Purple (#800080)
9. Pink (#FFC0CB)
10. Brown (#A52A2A)
11. Gray (#808080)
12. Navy Blue (#000080)
13. Sky Blue (#87CEEB)
14. Dark Green (#006400)
15. Lime Green (#32CD32)
16. Maroon (#800000)
17. Teal (#008080)
18. Gold (#FFD700)
19. Silver (#C0C0C0)
20. Beige (#F5F5DC)
21. Cream (#FFFDD0)
22. Khaki (#F0E68C)
23. Olive (#808000)
24. Turquoise (#40E0D0)
25. Coral (#FF7F50)
26. Lavender (#E6E6FA)
27. Mint (#98FF98)
28. Peach (#FFDAB9)
29. Burgundy (#800020)
30. Charcoal (#36454F)

## How to Run Seeds

### Run All Seeds
```bash
npm run seed:colors
```

This will:
1. Connect to your database
2. Check for existing colors (won't create duplicates)
3. Insert all 30 common colors
4. Close the connection

### Expected Output
```
🌱 Starting database seeding...

📡 Connecting to database...
✅ Database connected!

🎨 Starting color categories seeding...
✅ Created color: Black (#000000)
✅ Created color: White (#FFFFFF)
...
⏭️  Color "Black" already exists, skipping...

🎉 Color seeding completed! Total: 30 colors

✨ All seeds completed successfully!

📡 Database connection closed.
✅ Seeding process completed!
```

## Verifying Seeds

After running the seed script, you can verify the colors were created:

### Via API
```bash
curl http://localhost:3000/color-categories
```

### Via Database
```sql
SELECT * FROM core.color_categories;
```

## Adding More Seeds

To add more seed data:

1. Create a new seed data file in this directory (e.g., `categories.seed.ts`)
2. Create a seed function (e.g., `seed-categories.ts`)
3. Import and call it in `run-seed.ts`

Example:
```typescript
// categories.seed.ts
export const commonCategories = [
  { code: 'ELECTRONICS', description: 'Electronic items' },
  { code: 'CLOTHING', description: 'Clothing items' },
];

// seed-categories.ts
export async function seedCategories(dataSource: DataSource) {
  const repo = dataSource.getRepository(Common);
  // ... seeding logic
}

// run-seed.ts
import { seedCategories } from './seed-categories';

async function runSeeds() {
  // ... existing code
  await seedColors(AppDataSource);
  await seedCategories(AppDataSource);  // Add new seed
  // ...
}
```

## Important Notes

- The script checks for duplicates before inserting (by name)
- Safe to run multiple times
- Uses the same database connection settings as your app (from .env)
- All colors include `name`, `hexCode`, and `description` fields
- Colors are created with default BaseEntity fields (createdAt, updatedAt, active, etc.)

## Troubleshooting

### Connection Issues
```
❌ Error: Connection refused
```
**Solution:** Make sure your database is running and .env file has correct credentials.

### Duplicate Key Error
```
❌ Error: duplicate key value violates unique constraint
```
**Solution:** This shouldn't happen as the script checks for duplicates, but if it does, the color already exists in your database.

### TypeScript Errors
```
❌ Cannot find module
```
**Solution:** Run `npm install` to ensure all dependencies are installed.

## Environment Variables

The seed script uses the following environment variables (from .env):

- `DB_HOST` - Database host (default: 84.247.178.93)
- `DB_PORT` - Database port (default: 5432)
- `DB_USERNAME` - Database username (default: amtz)
- `DB_PASSWORD` - Database password (default: amtz)
- `DB_DATABASE` - Database name (default: inventorydb)
- `DB_SCHEMA` - Database schema (default: core)

Make sure your `.env` file is configured correctly before running seeds.
