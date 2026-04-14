import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { SmsMessage, SmsStatus } from './entities/sms-message.entity';

@Injectable()
export class BeemSmsService {
  private readonly logger = new Logger(BeemSmsService.name);
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly senderId: string;
  private readonly baseUrl = 'https://apisms.beem.africa';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(SmsMessage)
    private readonly smsRepo: Repository<SmsMessage>,
  ) {
    this.apiKey = process.env.BEEM_API_KEY || '';
    this.secretKey = process.env.BEEM_SECRET_KEY || '';
    this.senderId = process.env.BEEM_SENDER_ID || 'INFO';
  }

  /**
   * Normalize phone to international format without +
   * Accepts: +255753107301, 255753107301, 0753107301
   */
  private normalizePhone(phone: string): string {
    let p = (phone || '').replace(/\s|-|\+/g, '');
    if (p.startsWith('0')) p = '255' + p.slice(1);
    if (!p.startsWith('255')) p = '255' + p;
    return p;
  }

  /**
   * Detect if message needs Unicode encoding (for Swahili with special chars or emojis)
   */
  private needsUnicode(text: string): boolean {
    return /[^\x00-\x7F]/.test(text);
  }

  /**
   * Send SMS via Beem and persist every attempt to sms_messages.
   * @param context   label for where the SMS came from (e.g. 'sale:delivered')
   * @param reference optional linked reference (e.g. 'SALE-33')
   * @param businessId optional business scoping
   */
  async sendSms(
    phoneNumber: string,
    message: string,
    context?: string,
    reference?: string,
    businessId?: number,
  ): Promise<boolean> {
    const dest = this.normalizePhone(phoneNumber);
    const encoding = this.needsUnicode(message) ? 1 : 0;

    if (!this.apiKey || !this.secretKey) {
      this.logger.warn('Beem credentials not configured, skipping SMS');
      await this.saveLog(dest, message, SmsStatus.FAILED, 'Credentials not configured', context, reference, businessId);
      return false;
    }

    const auth = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v1/send`,
          {
            source_addr: this.senderId,
            encoding,
            message,
            recipients: [{ recipient_id: 1, dest_addr: dest }],
          },
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data?.data || response.data;
      if (data?.code && data.code !== 100) {
        this.logger.error(`Beem SMS failed: ${JSON.stringify(data)}`);
        await this.saveLog(dest, message, SmsStatus.FAILED, data.message || JSON.stringify(data), context, reference, businessId);
        return false;
      }

      this.logger.log(`SMS sent via Beem to ${dest}: ${data?.message || 'ok'}`);
      await this.saveLog(dest, message, SmsStatus.SENT, null, context, reference, businessId);
      return true;
    } catch (error) {
      const errText = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Beem SMS error for ${dest}: ${errText}`);
      await this.saveLog(dest, message, SmsStatus.FAILED, errText, context, reference, businessId);
      return false;
    }
  }

  private async saveLog(
    phoneNumber: string,
    message: string,
    status: SmsStatus,
    error: string | null,
    context: string | undefined,
    reference: string | undefined,
    businessId: number | undefined,
  ) {
    try {
      await this.smsRepo.save(
        this.smsRepo.create({
          phoneNumber,
          message,
          senderId: this.senderId,
          status,
          error: error || undefined,
          context,
          reference,
          businessId,
        }),
      );
    } catch (e) {
      this.logger.warn(`Failed to persist SMS log: ${e.message}`);
    }
  }

  /**
   * Check Beem SMS credit balance
   */
  async getBalance(): Promise<number | null> {
    if (!this.apiKey || !this.secretKey) return null;
    const auth = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/public/v1/vendors/balance`, {
          headers: { Authorization: `Basic ${auth}` },
        }),
      );
      return Number(response.data?.data?.credit_balance || 0);
    } catch (error) {
      this.logger.error(`Beem balance check failed: ${error.message}`);
      return null;
    }
  }
}
