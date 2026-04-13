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
}
