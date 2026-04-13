import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetaAdsService } from './meta-ads.service';

@Injectable()
export class MetaAdsCronService {
  private readonly logger = new Logger(MetaAdsCronService.name);

  constructor(private readonly metaAdsService: MetaAdsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async pullYesterdayInsights() {
    this.logger.log('Starting daily Meta Ads insight pull...');
    try {
      const adAccountId = process.env.META_AD_ACCOUNT_ID || '';
      if (!adAccountId) {
        this.logger.warn('META_AD_ACCOUNT_ID not configured, skipping');
        return;
      }

      const count = await this.metaAdsService.syncYesterday(1);
      this.logger.log(`Pulled ${count} Meta Ad insight rows for yesterday`);
    } catch (error) {
      this.logger.error(
        `Failed to pull Meta Ads insights: ${error.message}`,
        error.stack,
      );
    }
  }
}
