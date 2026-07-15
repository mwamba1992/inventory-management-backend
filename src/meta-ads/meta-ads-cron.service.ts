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

      const count = await this.metaAdsService.syncGaps(1);
      this.logger.log(`Pulled ${count} Meta Ad insight rows (gap-fill since last sync)`);
    } catch (error) {
      this.logger.error(
        `Failed to pull Meta Ads insights: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Flight guard — runs daily at 7AM (after the insight pull) to catch boosted
   * ad sets whose run window is about to end, and SMS the admin before they go
   * dark. Boosted posts stop delivering when end_time passes even though their
   * status stays ACTIVE, so this is the only reliable early warning.
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async checkAdFlights() {
    this.logger.log('Running Meta Ads flight-expiry check...');
    try {
      const flagged = await this.metaAdsService.checkAdFlights();
      this.logger.log(
        `Flight check complete: ${flagged.length} ad set(s) expiring within 3 days`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to run ad flight check: ${error.message}`,
        error.stack,
      );
    }
  }
}
