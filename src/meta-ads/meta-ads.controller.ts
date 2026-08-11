import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetaAdsService } from './meta-ads.service';
import { SyncMetaAdsDto } from './dto/sync-meta-ads.dto';
import { ReportFilterDto } from '../reports/dto/report-filter.dto';
import { AdPerformanceReport, AdRecommendations } from './interfaces/ad-performance.interface';

@ApiTags('Meta Ads')
@Controller('meta-ads')
export class MetaAdsController {
  constructor(private readonly metaAdsService: MetaAdsService) {}

  @Get('insights')
  @ApiOperation({ summary: 'Get ad performance report with ROAS' })
  async getAdPerformance(
    @Query() filter: ReportFilterDto,
  ): Promise<AdPerformanceReport> {
    return this.metaAdsService.getAdPerformance(filter);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get data-driven ad recommendations' })
  async getRecommendations(): Promise<AdRecommendations> {
    return this.metaAdsService.getRecommendations();
  }

  @Get('sync')
  @ApiOperation({ summary: 'Sync yesterday ad data from Meta' })
  async syncYesterday(): Promise<{ count: number; message: string }> {
    const count = await this.metaAdsService.syncYesterdayForCurrentUser();
    return { count, message: `Synced ${count} insight rows` };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Force sync specific date range from Meta' })
  async syncDateRange(
    @Body() dto: SyncMetaAdsDto,
  ): Promise<{ count: number; message: string }> {
    const count = await this.metaAdsService.syncDateRangeForCurrentUser(
      dto.startDate,
      dto.endDate,
    );
    return { count, message: `Synced ${count} insight rows` };
  }

  @Get('fatigue')
  @ApiOperation({
    summary: 'List ads whose 30-day frequency has crossed the rotation threshold',
  })
  async checkFatigue(@Query('threshold') threshold?: string): Promise<{
    threshold: number;
    flagged: Array<{ name: string; frequency: number; costPerConvo: number }>;
  }> {
    const t = threshold ? Number(threshold) : 1.7;
    const flagged = await this.metaAdsService.checkCreativeFatigue(t);
    return { threshold: t, flagged };
  }

  @Get('daily-report')
  @ApiOperation({
    summary: 'Preview yesterday\'s ad report (does not send the SMS)',
  })
  async previewDailyReport(): Promise<{
    message: string;
    adCount: number;
    spend: number;
  }> {
    return this.metaAdsService.buildDailyAdReport();
  }

  @Get('freshness')
  @ApiOperation({ summary: 'How stale the stored ad insight data is, in days' })
  async checkFreshness(): Promise<{ ageDays: number | null; stale: boolean }> {
    const ageDays = await this.metaAdsService.checkInsightFreshness();
    return { ageDays, stale: ageDays === null || ageDays > 2 };
  }
}
