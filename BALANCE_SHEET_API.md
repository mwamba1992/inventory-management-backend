# Balance Sheet Report API

## Endpoint
```
GET /reports/balance-sheet
```

## Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| asOfDate | string | No | Date for balance sheet (YYYY-MM-DD). Defaults to today | 2024-12-31 |

## Request Examples

### Get Current Balance Sheet
```bash
GET http://localhost:3000/reports/balance-sheet
```

### Get Historical Balance Sheet
```bash
GET http://localhost:3000/reports/balance-sheet?asOfDate=2024-12-31
```

## Response Format

```typescript
interface BalanceSheetReport {
  assets: {
    currentAssets: {
      inventory: number;      // Total inventory value at cost
      cash: number;          // Cash on hand
      total: number;         // Sum of current assets
    };
    totalAssets: number;     // Total of all assets
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;  // Money owed to suppliers
      total: number;            // Sum of current liabilities
    };
    totalLiabilities: number;   // Total of all liabilities
  };
  equity: {
    ownersEquity: number;       // Initial capital investment
    retainedEarnings: number;   // Cumulative profit/loss
    totalEquity: number;        // Total owner's stake
  };
  totalLiabilitiesAndEquity: number;  // Must equal totalAssets
  asOfDate: string;                   // Date of report (YYYY-MM-DD)
}
```

## Sample Response

```json
{
  "assets": {
    "currentAssets": {
      "inventory": 15000000,
      "cash": 0,
      "total": 15000000
    },
    "totalAssets": 15000000
  },
  "liabilities": {
    "currentLiabilities": {
      "accountsPayable": 0,
      "total": 0
    },
    "totalLiabilities": 0
  },
  "equity": {
    "ownersEquity": 12500000,
    "retainedEarnings": 2500000,
    "totalEquity": 15000000
  },
  "totalLiabilitiesAndEquity": 15000000,
  "asOfDate": "2025-11-05"
}
```

## Field Descriptions

### Assets
- **inventory**: Total value of all items in stock (calculated at purchase cost + freight)
- **cash**: Cash available (currently not tracked, returns 0)
- **totalAssets**: Sum of all asset values

### Liabilities
- **accountsPayable**: Money owed to suppliers (currently not tracked, returns 0)
- **totalLiabilities**: Sum of all liabilities

### Equity
- **ownersEquity**: Capital invested by owner (Auto-calculated: Assets - Liabilities - Retained Earnings)
- **retainedEarnings**: Profit/loss accumulated since business started (Revenue - Expenses - COGS)
- **totalEquity**: Total owner's stake in the business

## Accounting Equation
The balance sheet always follows this fundamental equation:

```
Assets = Liabilities + Equity
```

In the response:
```
totalAssets = totalLiabilities + totalEquity
```

## Currency
All amounts are in Tanzanian Shillings (TZS).

## Notes for Frontend
1. All monetary values are whole numbers (already rounded)
2. Display with thousand separators: `15000000` → `15,000,000 TZS`
3. Retained earnings can be negative (business loss)
4. The equation must always balance - use for validation
5. `asOfDate` returns data up to and including that date

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid date format",
  "error": "Bad Request"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## UI Suggestions

### Display Format
```
BALANCE SHEET
As of: November 5, 2025

ASSETS
Current Assets:
  Inventory                     15,000,000 TZS
  Cash                                   0 TZS
  ────────────────────────────────────────
  Total Current Assets          15,000,000 TZS

TOTAL ASSETS                    15,000,000 TZS

LIABILITIES
Current Liabilities:
  Accounts Payable                       0 TZS
  ────────────────────────────────────────
  Total Current Liabilities              0 TZS

TOTAL LIABILITIES                        0 TZS

EQUITY
  Owner's Equity                12,500,000 TZS
  Retained Earnings              2,500,000 TZS
  ────────────────────────────────────────
  Total Equity                  15,000,000 TZS

TOTAL LIABILITIES & EQUITY      15,000,000 TZS
```

## Future Enhancements
The following fields currently return 0 but will be implemented:
- Cash tracking
- Accounts Payable tracking
