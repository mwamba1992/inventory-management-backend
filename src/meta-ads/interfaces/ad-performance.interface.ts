import { MetricValue } from '../../reports/interfaces/report.interface';

export interface AdPerformanceReport {
  totalSpendUsd: MetricValue;
  totalSpendTzs: MetricValue;
  totalImpressions: MetricValue;
  totalClicks: MetricValue;
  totalConversions: MetricValue;
  totalReach: MetricValue;
  avgCpc: MetricValue;
  avgCtr: MetricValue;
  avgCpm: MetricValue;
  roas: MetricValue;
  revenue: MetricValue;
  usdToTzs: number;
  dailyBreakdown: AdDailyDataPoint[];
  campaignBreakdown: CampaignSummary[];
  dateRange: { startDate: string; endDate: string };
}

export interface AdDailyDataPoint {
  date: string;
  spendUsd: number;
  spendTzs: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export interface CampaignSummary {
  campaignId: string;
  campaignName: string;
  adCreativeBody: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export interface AdRecommendations {
  campaignActions: CampaignAction[];
  productsToAdvertise: ProductAdRecommendation[];
  budgetAdvice: BudgetAdvice;
  summary: string;
}

export interface CampaignAction {
  campaignId: string;
  campaignName: string;
  action: 'scale' | 'keep' | 'kill';
  reason: string;
  spend: number;
  conversions: number;
  costPerConversation: number;
  ctr: number;
}

export interface ProductAdRecommendation {
  itemId: number;
  name: string;
  code: string;
  reason: string;
  score: number;
  sellingPrice: number;
  profitMargin: number;
  stockOnHand: number;
  salesVelocity: number;
  hasBeenAdvertised: boolean;
}

export interface BudgetAdvice {
  currentDailySpend: number;
  recommendedDailySpend: number;
  topCampaignToScale: string | null;
  wastefulSpend: number;
  efficiency: string;
}
