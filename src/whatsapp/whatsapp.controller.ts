import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MessageHandlerService } from './services/message-handler.service';
import { WhatsAppOrderService } from './services/whatsapp-order.service';
import { WhatsAppMessageDto, WebhookVerificationDto } from './dto/webhook.dto';
import { OrderStatus } from './entities/whatsapp-order.entity';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly messageHandler: MessageHandlerService,
    private readonly orderService: WhatsAppOrderService,
  ) {}

  /**
   * Webhook verification endpoint
   * WhatsApp will call this to verify the webhook URL
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Verify WhatsApp webhook' })
  @ApiResponse({ status: 200, description: 'Webhook verified successfully' })
  @ApiResponse({ status: 403, description: 'Invalid verification token' })
  verifyWebhook(@Query() query: WebhookVerificationDto) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    console.log('mode' + mode);
    console.log('token ' + token);

    const VERIFY_TOKEN =
      process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token_here';

    console.log(VERIFY_TOKEN);

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        this.logger.log('Webhook verified successfully');
        return challenge;
      } else {
        this.logger.warn('Webhook verification failed: invalid token');
        return HttpStatus.FORBIDDEN;
      }
    }

    this.logger.warn('Webhook verification failed: missing parameters');
    return HttpStatus.BAD_REQUEST;
  }

  /**
   * Webhook endpoint to receive messages from WhatsApp
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive WhatsApp messages' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  receiveMessage(@Body() payload: WhatsAppMessageDto) {
    //this.logger.debug(`Received webhook: ${JSON.stringify(payload)}`);

    try {
      // Validate payload
      if (payload.object !== 'whatsapp_business_account') {
        this.logger.warn('Invalid webhook object type');
        return { status: 'ok' };
      }

      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value;

            // Process messages
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                const phoneNumber = message.from;
                const contactName = value.contacts?.[0]?.profile?.name;

                // Handle message asynchronously
                this.messageHandler
                  .handleIncomingMessage(phoneNumber, message, contactName)
                  .catch((error) => {
                    this.logger.error(
                      `Error handling message from ${phoneNumber}: ${error.message}`,
                      error.stack,
                    );
                  });
              }
            }

            // Log status updates
            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                this.logger.debug(
                  `Message ${status.id} status: ${status.status} for ${status.recipient_id}`,
                );
              }
            }
          }
        }
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      // Return 200 to prevent WhatsApp from retrying
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Get all orders
   */
  @Get('orders')
  @ApiOperation({ summary: 'Get all WhatsApp orders' })
  @ApiResponse({ status: 200, description: 'Returns all orders' })
  async getAllOrders() {
    return this.orderService.findAll();
  }

  /**
   * Get order by ID
   */
  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Returns the order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: number) {
    return this.orderService.findOne(id);
  }

  /**
   * Get orders by phone number
   */
  @Get('orders/phone/:phone')
  @ApiOperation({ summary: 'Get orders by customer phone number' })
  @ApiParam({ name: 'phone', description: 'Customer phone number' })
  @ApiResponse({ status: 200, description: 'Returns customer orders' })
  async getOrdersByPhone(@Param('phone') phone: string) {
    return this.orderService.findByPhone(phone);
  }

  /**
   * Update order status
   */
  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id') id: number,
    @Body() body: { status: OrderStatus },
  ) {
    return this.orderService.updateOrderStatus(id, body.status);
  }

  /**
   * Cancel order
   */
  @Put('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel delivered order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(@Param('id') id: number) {
    return this.orderService.cancelOrder(id);
  }

  /**
   * Get order statistics
   */
  @Get('stats/orders')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Returns order statistics' })
  async getOrderStats() {
    return this.orderService.getOrderStats();
  }

  /**
   * Generate WhatsApp product link
   */
  @Get('product-link/:itemId')
  @ApiOperation({ summary: 'Generate WhatsApp click-to-chat link for a product' })
  @ApiParam({ name: 'itemId', description: 'Product/Item ID' })
  @ApiResponse({ status: 200, description: 'Returns WhatsApp link' })
  async generateProductLink(@Param('itemId') itemId: number) {
    return this.messageHandler.generateProductLink(itemId);
  }
}
