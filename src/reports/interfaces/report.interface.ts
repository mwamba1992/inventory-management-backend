export interface MetricValue {
  current: number;
  previous: number;
  percentageChange: number;
  label: string;
  period: string;
}

export interface SalesTrendDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: number;
  name: string;
  code: string;
  revenue: number;
  quantitySold: number;
  orderCount: number;
}

export interface BusinessOverviewReport {
  totalRevenue: MetricValue;
  totalOrders: MetricValue;
  activeCustomers: MetricValue;
  avgOrderValue: MetricValue;
  salesTrend: SalesTrendDataPoint[];
  topProducts: TopProduct[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  salesByDay: SalesTrendDataPoint[];
  salesByCategory: Array<{ category: string; revenue: number; orders: number }>;
  topProducts: TopProduct[];
}

export interface InventoryItemDetail {
  id: number;
  productName: string;
  productCode: string;
  currentStock: number;
  minStock: number;
  value: number;
  warehouse: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  category?: string;
}

export interface InventoryReport {
  totalItems: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  itemsByCategory: Array<{ category: string; count: number; value: number }>;
  items: InventoryItemDetail[];
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  returningCustomers: number;
  returnRate: number;
  customerLifetimeValue: number;
  topCustomers: Array<{
    id: number;
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    lastOrder: string;
    status: string;
  }>;
}

export interface RetentionReport {
  totalCustomersWithOrders: number;
  oneTimeCustomers: number;
  repeatCustomers: number;
  repeatPurchaseRate: number; // percentage
  averageOrdersPerCustomer: number;
  averageLifetimeValue: number;
  totalLifetimeRevenue: number;
  segments: {
    oneTime: number; // 1 order
    occasional: number; // 2-4
    loyal: number; // 5+
  };
  churnBuckets: {
    active: number; // ≤30 days
    atRisk: number; // 31-60
    dormant: number; // 61-90
    lost: number; // >90
  };
  customers: Array<{
    id: number;
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    firstOrder: string;
    lastOrder: string;
    daysSinceLastOrder: number;
    bucket: 'active' | 'at_risk' | 'dormant' | 'lost';
    segment: 'one_time' | 'occasional' | 'loyal';
  }>;
}

export interface FinancialReport {
  totalRevenue: MetricValue;
  totalExpenses: MetricValue;
  netProfit: MetricValue;
  profitMargin: MetricValue;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface BalanceSheetReport {
  assets: {
    currentAssets: {
      inventory: number;
      cash: number;
      total: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      total: number;
    };
    totalLiabilities: number;
  };
  equity: {
    ownersEquity: number;
    retainedEarnings: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  asOfDate: string;
}
