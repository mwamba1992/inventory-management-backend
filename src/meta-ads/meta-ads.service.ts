import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MetaAdInsight } from './entities/meta-ad-insight.entity';
import { Sale } from '../sale/entities/sale.entity';
import { WhatsAppOrder } from '../whatsapp/entities/whatsapp-order.entity';
import { Item } from '../items/item/entities/item.entity';
import { ItemPrice } from '../items/item/entities/item-price.entity';
import { ItemStock } from '../items/item/entities/item-stock.entity';
import { UserContextService } from '../auth/user/dto/user.context';
import { DateRange, ReportFilterDto } from '../reports/dto/report-filter.dto';
import {
  AdPerformanceReport,
  AdDailyDataPoint,
  CampaignSummary,
  AdRecommendations,
  CampaignAction,
  ProductAdRecommendation,
} from './interfaces/ad-performance.interface';
import { MetricValue } from '../reports/interfaces/report.interface';

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);
  private readonly accessToken: string;
  private readonly adAccountId: string;
  private readonly apiBaseUrl = 'https://graph.facebook.com/v21.0';
  // USD to TZS conversion — Meta charges in USD, sales are in TZS
  private readonly usdToTzs = Number(process.env.USD_TO_TZS_RATE || '2500');

  constructor(
    @InjectRepository(MetaAdInsight)
    private readonly insightRepo: Repository<MetaAdInsight>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(WhatsAppOrder)
    private readonly whatsappOrderRepo: Repository<WhatsAppOrder>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(ItemPrice)
    private readonly itemPriceRepo: Repository<ItemPrice>,
    @InjectRepository(ItemStock)
    private readonly itemStockRepo: Repository<ItemStock>,
    private readonly httpService: HttpService,
    private readonly userContextService: UserContextService,
  ) {
    this.accessToken = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.adAccountId = process.env.META_AD_ACCOUNT_ID || '';
  }

  /**
   * Fetch insights from Meta Marketing API and store in DB
   */
  async fetchAndStoreInsights(
    startDate: string,
    endDate: string,
    businessId: number,
  ): Promise<number> {
    if (!this.accessToken || !this.adAccountId) {
      this.logger.warn('Meta Ads credentials not configured');
      return 0;
    }

    const fields = [
      'campaign_id', 'campaign_name',
      'adset_id', 'adset_name',
      'ad_id', 'ad_name',
      'spend', 'impressions', 'clicks',
      'reach', 'frequency',
      'cpc', 'cpm', 'ctr',
      'actions',
    ].join(',');

    let totalRows = 0;
    const accountId = this.adAccountId.startsWith('act_') ? this.adAccountId : `act_${this.adAccountId}`;
    let url = `${this.apiBaseUrl}/${accountId}/insights`;
    let params: Record<string, string> = {
      fields,
      level: 'ad',
      time_increment: '1',
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      limit: '500',
      access_token: this.accessToken,
    };

    // Paginate through all results
    while (url) {
      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      const data = response.data?.data || [];
      if (data.length === 0) break;

      const insights: Partial<MetaAdInsight>[] = data.map((row: any) => ({
        businessId,
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        adSetId: row.adset_id || null,
        adSetName: row.adset_name || null,
        adId: row.ad_id || null,
        adName: row.ad_name || null,
        date: row.date_start,
        spend: Number(row.spend || 0),
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        conversions: this.extractConversions(row.actions),
        reach: Number(row.reach || 0),
        frequency: Number(row.frequency || 0),
        cpc: Number(row.cpc || 0),
        cpm: Number(row.cpm || 0),
        ctr: Number(row.ctr || 0),
        actions: row.actions || null,
      }));

      await this.insightRepo.upsert(insights, {
        conflictPaths: ['campaignId', 'adId', 'date', 'businessId'],
      });

      totalRows += insights.length;

      // Handle pagination
      const nextUrl = response.data?.paging?.next;
      if (nextUrl) {
        url = nextUrl;
        params = {}; // next URL includes all params
      } else {
        break;
      }
    }

    this.logger.log(`Stored ${totalRows} insight rows for ${startDate} to ${endDate}`);
    return totalRows;
  }

  /**
   * Extract conversion count from Meta actions array
   */
  private extractConversions(actions: any[]): number {
    if (!actions || !Array.isArray(actions)) return 0;

    const conversionTypes = [
      'offsite_conversion.fb_pixel_purchase',
      'omni_purchase',
      'onsite_conversion.messaging_conversation_started_7d',
      'onsite_conversion.messaging_first_reply',
    ];

    for (const type of conversionTypes) {
      const action = actions.find((a: any) => a.action_type === type);
      if (action) return Number(action.value || 0);
    }

    return 0;
  }

  /**
   * Sync yesterday's data (used by cron — no UserContextService)
   */
  async syncYesterday(businessId: number): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    return this.fetchAndStoreInsights(dateStr, dateStr, businessId);
  }

  /**
   * Sync yesterday's data for current authenticated user
   */
  async syncYesterdayForCurrentUser(): Promise<number> {
    const businessId = this.userContextService.getBusinessId();
    return this.syncYesterday(businessId);
  }

  /**
   * Sync a specific date range for current authenticated user
   */
  async syncDateRangeForCurrentUser(
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const businessId = this.userContextService.getBusinessId();
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    })();
    return this.fetchAndStoreInsights(start, end, businessId);
  }

  /**
   * Get ad performance report with ROAS
   */
  async getAdPerformance(filter: ReportFilterDto): Promise<AdPerformanceReport> {
    const businessId = this.userContextService.getBusinessId();
    const { startDate, endDate, previousStartDate, previousEndDate } =
      this.getDateRange(filter);

    // Current period ad metrics
    const currentMetrics = await this.getAggregatedMetrics(
      startDate, endDate, businessId,
    );

    // Previous period ad metrics
    const previousMetrics = await this.getAggregatedMetrics(
      previousStartDate, previousEndDate, businessId,
    );

    // Revenue for ROAS calculation
    const currentRevenue = await this.getTotalRevenue(startDate, endDate, businessId);
    const previousRevenue = await this.getTotalRevenue(previousStartDate, previousEndDate, businessId);

    // Convert USD spend to TZS for proper ROAS (revenue is TZS, spend is USD)
    const currentSpendTzs = currentMetrics.spend * this.usdToTzs;
    const previousSpendTzs = previousMetrics.spend * this.usdToTzs;

    const currentRoas = currentSpendTzs > 0 ? currentRevenue / currentSpendTzs : 0;
    const previousRoas = previousSpendTzs > 0 ? previousRevenue / previousSpendTzs : 0;

    const periodLabel = this.getPeriodLabel(filter.dateRange);

    // Daily breakdown
    const dailyBreakdown = await this.getDailyBreakdown(startDate, endDate, businessId);

    // Campaign breakdown
    const campaignBreakdown = await this.getCampaignBreakdown(startDate, endDate, businessId);

    return {
      totalSpendUsd: this.buildMetric(currentMetrics.spend, previousMetrics.spend, 'Ad Spend (USD)', periodLabel),
      totalSpendTzs: this.buildMetric(
        Number(currentSpendTzs.toFixed(0)),
        Number(previousSpendTzs.toFixed(0)),
        'Ad Spend (TZS)',
        periodLabel,
      ),
      totalImpressions: this.buildMetric(currentMetrics.impressions, previousMetrics.impressions, 'Total Impressions', periodLabel),
      totalClicks: this.buildMetric(currentMetrics.clicks, previousMetrics.clicks, 'Total Clicks', periodLabel),
      totalConversions: this.buildMetric(currentMetrics.conversions, previousMetrics.conversions, 'Total Conversions', periodLabel),
      totalReach: this.buildMetric(currentMetrics.reach, previousMetrics.reach, 'Total Reach', periodLabel),
      avgCpc: this.buildMetric(currentMetrics.avgCpc, previousMetrics.avgCpc, 'Avg CPC (USD)', periodLabel),
      avgCtr: this.buildMetric(currentMetrics.avgCtr, previousMetrics.avgCtr, 'Avg CTR (%)', periodLabel),
      avgCpm: this.buildMetric(currentMetrics.avgCpm, previousMetrics.avgCpm, 'Avg CPM (USD)', periodLabel),
      roas: this.buildMetric(
        Number(currentRoas.toFixed(2)),
        Number(previousRoas.toFixed(2)),
        'Return on Ad Spend',
        periodLabel,
      ),
      revenue: this.buildMetric(currentRevenue, previousRevenue, 'Total Revenue (TZS)', periodLabel),
      usdToTzs: this.usdToTzs,
      dailyBreakdown,
      campaignBreakdown,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    };
  }

  private async getAggregatedMetrics(
    startDate: Date,
    endDate: Date,
    businessId: number,
  ): Promise<{
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    reach: number;
    avgCpc: number;
    avgCtr: number;
    avgCpm: number;
  }> {
    const result = await this.insightRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.spend), 0)', 'spend')
      .addSelect('COALESCE(SUM(i.impressions), 0)', 'impressions')
      .addSelect('COALESCE(SUM(i.clicks), 0)', 'clicks')
      .addSelect('COALESCE(SUM(i.conversions), 0)', 'conversions')
      .addSelect('COALESCE(SUM(i.reach), 0)', 'reach')
      .where('i.date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .andWhere('i.business_id = :businessId', { businessId })
      .getRawOne();

    const spend = Number(result?.spend || 0);
    const impressions = Number(result?.impressions || 0);
    const clicks = Number(result?.clicks || 0);

    return {
      spend,
      impressions,
      clicks,
      conversions: Number(result?.conversions || 0),
      reach: Number(result?.reach || 0),
      avgCpc: clicks > 0 ? Number((spend / clicks).toFixed(4)) : 0,
      avgCtr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(4)) : 0,
      avgCpm: impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(4)) : 0,
    };
  }

  private async getTotalRevenue(
    startDate: Date,
    endDate: Date,
    businessId: number,
  ): Promise<number> {
    const salesResult = await this.saleRepo
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.amountPaid), 0)', 'total')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.business_id = :businessId', { businessId })
      .getRawOne();

    const whatsappResult = await this.whatsappOrderRepo
      .createQueryBuilder('wo')
      .select('COALESCE(SUM(wo.totalAmount), 0)', 'total')
      .where('wo.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('wo.status IN (:...statuses)', {
        statuses: ['confirmed', 'processing', 'ready', 'delivered'],
      })
      .andWhere('wo.business_id = :businessId', { businessId })
      .getRawOne();

    return Number(salesResult?.total || 0) + Number(whatsappResult?.total || 0);
  }

  private async getDailyBreakdown(
    startDate: Date,
    endDate: Date,
    businessId: number,
  ): Promise<AdDailyDataPoint[]> {
    const adDaily = await this.insightRepo
      .createQueryBuilder('i')
      .select('i.date', 'date')
      .addSelect('COALESCE(SUM(i.spend), 0)', 'spend')
      .addSelect('COALESCE(SUM(i.impressions), 0)', 'impressions')
      .addSelect('COALESCE(SUM(i.clicks), 0)', 'clicks')
      .addSelect('COALESCE(SUM(i.conversions), 0)', 'conversions')
      .where('i.date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .andWhere('i.business_id = :businessId', { businessId })
      .groupBy('i.date')
      .orderBy('i.date', 'ASC')
      .getRawMany();

    // Get daily revenue for ROAS per day
    const salesDaily = await this.saleRepo
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('COALESCE(SUM(sale.amountPaid), 0)', 'revenue')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.business_id = :businessId', { businessId })
      .groupBy('DATE(sale.createdAt)')
      .getRawMany();

    const whatsappDaily = await this.whatsappOrderRepo
      .createQueryBuilder('wo')
      .select('DATE(wo.createdAt)', 'date')
      .addSelect('COALESCE(SUM(wo.totalAmount), 0)', 'revenue')
      .where('wo.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('wo.status IN (:...statuses)', {
        statuses: ['confirmed', 'processing', 'ready', 'delivered'],
      })
      .andWhere('wo.business_id = :businessId', { businessId })
      .groupBy('DATE(wo.createdAt)')
      .getRawMany();

    // Merge revenue by date
    const revenueByDate = new Map<string, number>();
    for (const row of [...salesDaily, ...whatsappDaily]) {
      const dateKey = new Date(row.date).toISOString().split('T')[0];
      revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + Number(row.revenue));
    }

    return adDaily.map((row) => {
      const dateKey = new Date(row.date).toISOString().split('T')[0];
      const spendUsd = Number(row.spend);
      const spendTzs = spendUsd * this.usdToTzs;
      const revenue = revenueByDate.get(dateKey) || 0;
      return {
        date: dateKey,
        spendUsd,
        spendTzs: Number(spendTzs.toFixed(0)),
        impressions: Number(row.impressions),
        clicks: Number(row.clicks),
        conversions: Number(row.conversions),
        revenue,
        roas: spendTzs > 0 ? Number((revenue / spendTzs).toFixed(2)) : 0,
      };
    });
  }

  private async getCampaignBreakdown(
    startDate: Date,
    endDate: Date,
    businessId: number,
  ): Promise<CampaignSummary[]> {
    const rows = await this.insightRepo
      .createQueryBuilder('i')
      .select('i.campaign_id', 'campaignId')
      .addSelect('i.campaign_name', 'campaignName')
      .addSelect('COALESCE(SUM(i.spend), 0)', 'spend')
      .addSelect('COALESCE(SUM(i.impressions), 0)', 'impressions')
      .addSelect('COALESCE(SUM(i.clicks), 0)', 'clicks')
      .addSelect('COALESCE(SUM(i.conversions), 0)', 'conversions')
      .where('i.date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .andWhere('i.business_id = :businessId', { businessId })
      .groupBy('i.campaign_id')
      .addGroupBy('i.campaign_name')
      .orderBy('spend', 'DESC')
      .getRawMany();

    return rows.map((row) => {
      const spend = Number(row.spend);
      const impressions = Number(row.impressions);
      const clicks = Number(row.clicks);
      return {
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        spend,
        impressions,
        clicks,
        conversions: Number(row.conversions),
        ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
        cpc: clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0,
      };
    });
  }

  /**
   * Data-driven ad recommendations — no AI, pure scoring
   */
  async getRecommendations(): Promise<AdRecommendations> {
    const businessId = this.userContextService.getBusinessId();

    // Last 30 days for campaign scoring
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // 1. Score campaigns: group by campaign, rank by cost-per-conversation
    const campaigns = await this.insightRepo
      .createQueryBuilder('i')
      .select('i.campaign_id', 'campaignId')
      .addSelect('i.campaign_name', 'campaignName')
      .addSelect('COALESCE(SUM(i.spend), 0)', 'spend')
      .addSelect('COALESCE(SUM(i.impressions), 0)', 'impressions')
      .addSelect('COALESCE(SUM(i.clicks), 0)', 'clicks')
      .addSelect('COALESCE(SUM(i.conversions), 0)', 'conversions')
      .where('i.date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .andWhere('i.business_id = :businessId', { businessId })
      .groupBy('i.campaign_id')
      .addGroupBy('i.campaign_name')
      .orderBy('spend', 'DESC')
      .getRawMany();

    // Classify campaigns
    const campaignActions: CampaignAction[] = campaigns.map((c) => {
      const spend = Number(c.spend);
      const conversions = Number(c.conversions);
      const clicks = Number(c.clicks);
      const impressions = Number(c.impressions);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const costPerConversation = conversions > 0 ? spend / conversions : spend > 0 ? Infinity : 0;

      let action: 'scale' | 'keep' | 'kill';
      let reason: string;

      if (conversions >= 5 && costPerConversation < 0.50) {
        action = 'scale';
        reason = `Strong performer: ${conversions} conversations at $${costPerConversation.toFixed(2)} each. Increase budget to $10-15/day.`;
      } else if (conversions >= 2 && costPerConversation < 1.00) {
        action = 'keep';
        reason = `Decent ROI: ${conversions} conversations at $${costPerConversation.toFixed(2)} each. Maintain current budget.`;
      } else if (spend >= 5 && conversions < 2) {
        action = 'kill';
        reason = `Spent $${spend.toFixed(2)} with only ${conversions} conversation(s). Cut this ad and reallocate budget.`;
      } else if (ctr < 1.0 && spend >= 3) {
        action = 'kill';
        reason = `Low engagement: ${ctr.toFixed(1)}% CTR after $${spend.toFixed(2)} spent. Creative isn't resonating.`;
      } else {
        action = 'keep';
        reason = `Still gathering data ($${spend.toFixed(2)} spent). Review after 7+ days.`;
      }

      return {
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        action,
        reason,
        spend,
        conversions,
        costPerConversation: costPerConversation === Infinity ? -1 : Number(costPerConversation.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
      };
    });

    // 2. Products to advertise: score by margin * stock * sales velocity
    // Get items with stock and active prices
    const items = await this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.brand', 'brand')
      .where('item.business_id = :businessId', { businessId })
      .getMany();

    const itemIds = items.map((i) => i.id);
    if (itemIds.length === 0) {
      return {
        campaignActions,
        productsToAdvertise: [],
        budgetAdvice: this.buildBudgetAdvice(campaignActions),
        summary: this.buildSummary(campaignActions, []),
      };
    }

    // Get active prices
    const prices = await this.itemPriceRepo
      .createQueryBuilder('p')
      .leftJoin('p.item', 'item')
      .addSelect('item.id')
      .where('p.isActive = true')
      .andWhere('item.id IN (:...itemIds)', { itemIds })
      .getMany();

    const priceMap = new Map<number, { sellingPrice: number; purchaseAmount: number; profitMargin: number }>();
    for (const p of prices) {
      priceMap.set((p as any).item?.id || (p as any).__item__?.id || 0, {
        sellingPrice: Number(p.sellingPrice),
        purchaseAmount: Number(p.purchaseAmount) + Number(p.freightAmount),
        profitMargin: Number(p.profitMargin),
      });
    }

    // Get stock
    const stocks = await this.itemStockRepo
      .createQueryBuilder('s')
      .leftJoin('s.item', 'item')
      .addSelect('item.id')
      .where('item.id IN (:...itemIds)', { itemIds })
      .getMany();

    const stockMap = new Map<number, number>();
    for (const s of stocks) {
      const itemId = (s as any).item?.id || (s as any).__item__?.id || 0;
      stockMap.set(itemId, (stockMap.get(itemId) || 0) + s.quantity);
    }

    // Get sales velocity (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const salesVelocity = await this.saleRepo
      .createQueryBuilder('sale')
      .select('sale.item_id', 'itemId')
      .addSelect('COUNT(*)', 'salesCount')
      .addSelect('SUM(sale.amountPaid)', 'totalRevenue')
      .where('sale.createdAt >= :since', { since: ninetyDaysAgo })
      .andWhere('sale.business_id = :businessId', { businessId })
      .groupBy('sale.item_id')
      .getRawMany();

    const velocityMap = new Map<number, { count: number; revenue: number }>();
    for (const v of salesVelocity) {
      velocityMap.set(Number(v.itemId), {
        count: Number(v.salesCount),
        revenue: Number(v.totalRevenue),
      });
    }

    // Check which product names appear in campaign names (already advertised)
    const campaignNames = campaigns.map((c) => (c.campaignName || '').toLowerCase());

    // Score each item
    const productScores: ProductAdRecommendation[] = items
      .map((item) => {
        const price = priceMap.get(item.id);
        const stock = stockMap.get(item.id) || 0;
        const velocity = velocityMap.get(item.id) || { count: 0, revenue: 0 };
        const sellingPrice = price?.sellingPrice || 0;
        const margin = price?.profitMargin || 0;

        // Skip out of stock
        if (stock <= 0) return null;
        // Skip items with no price
        if (sellingPrice <= 0) return null;

        // Check if already being advertised
        const itemNameLower = item.name.toLowerCase();
        const brandName = (item.brand?.name || '').toLowerCase();
        const hasBeenAdvertised = campaignNames.some(
          (cn) => cn.includes(itemNameLower) || (brandName && cn.includes(brandName)),
        );

        // Scoring:
        // - High margin = good (weight: 3)
        // - Has stock = required (already filtered)
        // - High sales velocity = proven seller (weight: 2)
        // - NOT already advertised = untapped opportunity (weight: 1.5)
        // - Lower price point = easier first purchase (weight: 1)
        let score = 0;
        score += Math.min(margin, 100) * 3; // margin up to 300 points
        score += Math.min(velocity.count, 20) * 15; // velocity up to 300 points
        if (!hasBeenAdvertised) score += 150; // untapped bonus
        if (sellingPrice < 200000) score += 100; // low-price-point bonus (< 200K TZS)
        if (sellingPrice >= 200000 && sellingPrice < 400000) score += 50; // mid-range
        score += Math.min(stock, 10) * 10; // stock depth up to 100 points

        let reason = '';
        if (!hasBeenAdvertised && velocity.count > 0) {
          reason = `Proven seller (${velocity.count} sales in 90d) but never advertised. High potential.`;
        } else if (!hasBeenAdvertised && margin > 50) {
          reason = `High margin (${margin.toFixed(0)}%) and not yet advertised. Test with small budget.`;
        } else if (velocity.count >= 5) {
          reason = `Top seller (${velocity.count} sales in 90d). Scale ad spend to capture more demand.`;
        } else if (sellingPrice < 150000 && stock >= 3) {
          reason = `Low price point (TZS${sellingPrice.toLocaleString()}) with ${stock} in stock. Good for volume/acquisition ads.`;
        } else {
          reason = `${stock} in stock, ${velocity.count} recent sales, ${margin.toFixed(0)}% margin.`;
        }

        return {
          itemId: item.id,
          name: item.name,
          code: item.code || '',
          reason,
          score,
          sellingPrice,
          profitMargin: Number(margin.toFixed(1)),
          stockOnHand: stock,
          salesVelocity: velocity.count,
          hasBeenAdvertised,
        };
      })
      .filter((x): x is ProductAdRecommendation => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const budgetAdvice = this.buildBudgetAdvice(campaignActions);
    const summary = this.buildSummary(campaignActions, productScores);

    return { campaignActions, productsToAdvertise: productScores, budgetAdvice, summary };
  }

  private buildBudgetAdvice(actions: CampaignAction[]) {
    const totalSpend = actions.reduce((sum, a) => sum + a.spend, 0);
    const daysInPeriod = 30;
    const currentDaily = totalSpend / daysInPeriod;

    const wasteful = actions
      .filter((a) => a.action === 'kill')
      .reduce((sum, a) => sum + a.spend, 0);

    const topScale = actions.find((a) => a.action === 'scale');

    const killCount = actions.filter((a) => a.action === 'kill').length;
    const scaleCount = actions.filter((a) => a.action === 'scale').length;

    let efficiency: string;
    if (scaleCount > 0 && killCount === 0) {
      efficiency = 'Excellent — all campaigns performing. Consider increasing total budget.';
    } else if (scaleCount > 0 && killCount > 0) {
      efficiency = `Mixed — ${scaleCount} winner(s) to scale, ${killCount} to cut. Reallocate wasted budget to winners.`;
    } else if (killCount > actions.length / 2) {
      efficiency = 'Poor — most campaigns underperforming. Pause, rethink creative/targeting, restart.';
    } else {
      efficiency = 'Moderate — campaigns still gathering data. Review again in 7 days.';
    }

    return {
      currentDailySpend: Number(currentDaily.toFixed(2)),
      recommendedDailySpend: Number(Math.max(currentDaily - wasteful / daysInPeriod, 3).toFixed(2)),
      topCampaignToScale: topScale?.campaignName || null,
      wastefulSpend: Number(wasteful.toFixed(2)),
      efficiency,
    };
  }

  private buildSummary(actions: CampaignAction[], products: ProductAdRecommendation[]): string {
    const scale = actions.filter((a) => a.action === 'scale');
    const kill = actions.filter((a) => a.action === 'kill');
    const untapped = products.filter((p) => !p.hasBeenAdvertised).slice(0, 3);

    const parts: string[] = [];

    if (scale.length > 0) {
      parts.push(`Scale ${scale.length} campaign(s): ${scale.map((s) => `"${s.campaignName.substring(0, 40)}"`).join(', ')}.`);
    }
    if (kill.length > 0) {
      parts.push(`Kill ${kill.length} underperforming campaign(s) to save $${kill.reduce((s, k) => s + k.spend, 0).toFixed(2)}.`);
    }
    if (untapped.length > 0) {
      parts.push(`Try advertising: ${untapped.map((p) => p.name).join(', ')} — proven sellers not yet advertised.`);
    }

    return parts.join(' ') || 'Not enough data yet. Sync more ad data and check back.';
  }

  private buildMetric(
    current: number,
    previous: number,
    label: string,
    period: string,
  ): MetricValue {
    const percentageChange =
      previous === 0 ? (current > 0 ? 100 : 0) : Number((((current - previous) / previous) * 100).toFixed(1));
    return { current, previous, percentageChange, label, period };
  }

  private getDateRange(filter: ReportFilterDto): {
    startDate: Date;
    endDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (filter.startDate && filter.endDate) {
      startDate = new Date(filter.startDate);
      endDate = new Date(filter.endDate);
    } else {
      switch (filter.dateRange) {
        case DateRange.LAST_7_DAYS:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case DateRange.LAST_30_DAYS:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        case DateRange.LAST_90_DAYS:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
          break;
        case DateRange.THIS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case DateRange.LAST_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case DateRange.THIS_YEAR:
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
      }
    }

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  private getPeriodLabel(dateRange?: DateRange): string {
    if (!dateRange) return 'Last 30 days';
    const labels: Record<DateRange, string> = {
      [DateRange.LAST_7_DAYS]: 'Last 7 days',
      [DateRange.LAST_30_DAYS]: 'Last 30 days',
      [DateRange.LAST_90_DAYS]: 'Last 90 days',
      [DateRange.THIS_MONTH]: 'This month',
      [DateRange.LAST_MONTH]: 'Last month',
      [DateRange.THIS_YEAR]: 'This year',
      [DateRange.CUSTOM]: 'Custom range',
    };
    return labels[dateRange] || 'Last 30 days';
  }
}
