import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  TextMessage,
  InteractiveButtonMessage,
  InteractiveListMessage,
  ImageMessage,
} from '../interfaces/message.interface';

@Injectable()
export class WhatsAppApiService {
  private readonly logger = new Logger(WhatsAppApiService.name);
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(private readonly httpService: HttpService) {
    // These should be in environment variables
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  async sendTextMessage(to: string, message: string): Promise<any> {
    const payload: TextMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    return this.sendMessage(payload);
  }

  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<any> {
    this.logger.log(`📸 Sending image message to ${to}`);
    this.logger.log(`Image URL: ${imageUrl}`);
    this.logger.log(`Caption length: ${caption?.length || 0} chars`);

    const payload: ImageMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption?.substring(0, 1024), // WhatsApp caption limit
      },
    };

    this.logger.log(`Sending image payload: ${JSON.stringify(payload)}`);
    const result = await this.sendMessage(payload);
    this.logger.log(`Image message sent successfully: ${JSON.stringify(result)}`);
    return result;
  }

  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<any> {
    const payload: InteractiveButtonMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons.slice(0, 3).map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title.substring(0, 20), // WhatsApp limit
            },
          })),
        },
      },
    };

    return this.sendMessage(payload);
  }

  async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    headerText?: string,
    footerText?: string,
  ): Promise<any> {
    const payload: InteractiveListMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: bodyText,
        },
        action: {
          button: buttonText,
          sections: sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title.substring(0, 24), // WhatsApp limit
              description: row.description?.substring(0, 72), // WhatsApp limit
            })),
          })),
        },
      },
    };

    if (headerText) {
      payload.interactive.header = {
        type: 'text',
        text: headerText,
      };
    }

    if (footerText) {
      payload.interactive.footer = {
        text: footerText,
      };
    }

    return this.sendMessage(payload);
  }

  async markMessageAsRead(messageId: string): Promise<any> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
    }
  }

  private async sendMessage(payload: any): Promise<any> {
    try {
      this.logger.debug(`Sending message: ${JSON.stringify(payload)}`);

      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.debug(`Message sent successfully: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw error;
    }
  }
}
