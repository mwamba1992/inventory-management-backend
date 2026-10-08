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

    // Runs even if the pull above threw — a failed sync is exactly when the
    // staleness warning matters most.
    try {
      await this.metaAdsService.checkInsightFreshness();
    } catch (error) {
      this.logger.error(`Freshness check failed: ${error.message}`);
    }
  }

  /**
   * Daily performance report — 7:30AM, after the 6AM sync and the 7AM flight
   * check, so the SMS reflects data pulled the same morning.
   */
  @Cron('30 7 * * *')
  async sendDailyReport() {
    this.logger.log('Sending daily Meta Ads report...');
    try {
      await this.metaAdsService.sendDailyAdReport();
    } catch (error) {
      this.logger.error(
        `Failed to send daily ad report: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Creative fatigue guard — runs daily at 8AM. Frequency above ~1.7 is this
   * account's measured point where cost per conversation doubles, so the admin
   * gets told to rotate creative before the money is wasted rather than after.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkCreativeFatigue() {
    this.logger.log('Running Meta Ads creative fatigue check...');
    try {
      const flagged = await this.metaAdsService.checkCreativeFatigue();
      this.logger.log(
        `Fatigue check complete: ${flagged.length} ad(s) above the rotation threshold`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to run creative fatigue check: ${error.message}`,
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
