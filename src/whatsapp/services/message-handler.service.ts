import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { WhatsAppApiService } from './whatsapp-api.service';
import { WhatsAppOrderService } from './whatsapp-order.service';
import { ItemService } from '../../items/item/item.service';
import { CommonService } from '../../settings/common/common.service';
import { CustomerService } from '../../settings/customer/customer.service';
import { SessionState } from '../entities/whatsapp-session.entity';
import { WhatsAppMessage } from '../dto/webhook.dto';
import { CartItem } from '../interfaces/message.interface';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly whatsappApi: WhatsAppApiService,
    private readonly orderService: WhatsAppOrderService,
    private readonly itemService: ItemService,
    private readonly commonService: CommonService,
    private readonly customerService: CustomerService,
    private readonly configService: ConfigService,
  ) {}

  async handleIncomingMessage(
    phoneNumber: string,
    message: WhatsAppMessage,
    contactName?: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing message from ${phoneNumber}`);

      // Mark message as read
      await this.whatsappApi.markMessageAsRead(message.id);

      // Get or create session
      const session = await this.sessionService.getOrCreateSession(phoneNumber);

      // Ensure customer exists
      await this.ensureCustomerExists(phoneNumber, contactName);

      // Extract message content
      const messageContent = this.extractMessageContent(message);

      // Check for quick order format (ORDER:PROD-XXX or ORDER:<itemId>)
      if (messageContent.startsWith('ORDER:')) {
        const productIdentifier = messageContent.substring(6).trim();
        await this.handleQuickOrder(phoneNumber, productIdentifier);
        return;
      }

      // Route based on session state
      await this.routeMessage(phoneNumber, session.state, messageContent);
    } catch (error) {
      this.logger.error(
        `Error handling message: ${error.message}`,
        error.stack,
      );
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'Sorry, something went wrong. Please try again or type "menu" to return to main menu.',
      );
    }
  }

  private extractMessageContent(message: WhatsAppMessage): string {
    if (message.type === 'text' && message.text) {
      return message.text.body.trim();
    } else if (message.type === 'interactive') {
      if (message.interactive?.button_reply) {
        return message.interactive.button_reply.id;
      } else if (message.interactive?.list_reply) {
        return message.interactive.list_reply.id;
      }
    } else if (message.type === 'button' && message.button) {
      return message.button.payload;
    }
    return '';
  }

  private async routeMessage(
    phoneNumber: string,
    state: SessionState,
    content: string,
  ): Promise<void> {
    // Handle global commands
    if (content.toLowerCase() === 'menu' || content.toLowerCase() === 'start') {
      return this.showMainMenu(phoneNumber);
    }

    if (content.toLowerCase() === 'help') {
      return this.showHelp(phoneNumber);
    }

    // Route based on state
    switch (state) {
      case SessionState.MAIN_MENU:
        await this.handleMainMenu(phoneNumber, content);
        break;

      case SessionState.BROWSING_CATEGORIES:
        await this.handleCategorySelection(phoneNumber, content);
        break;

      case SessionState.VIEWING_ITEMS:
        await this.handleItemSelection(phoneNumber, content);
        break;

      case SessionState.SEARCHING:
        await this.handleSearch(phoneNumber, content);
        break;

      case SessionState.SEARCHING_BY_CODE:
        await this.handleCodeSearch(phoneNumber, content);
        break;

      case SessionState.ADDING_TO_CART:
        await this.handleAddToCart(phoneNumber, content);
        break;

      case SessionState.CART_REVIEW:
        await this.handleCartReview(phoneNumber, content);
        break;

      case SessionState.ENTERING_ADDRESS:
        await this.handleAddressEntry(phoneNumber, content);
        break;

      case SessionState.CONFIRMING_ORDER:
        await this.handleOrderConfirmation(phoneNumber, content);
        break;

      case SessionState.TRACKING_ORDER:
        await this.handleOrderTracking(phoneNumber, content);
        break;

      case SessionState.RATING_ORDER:
        await this.handleRatingSelection(phoneNumber, content);
        break;

      case SessionState.PROVIDING_FEEDBACK:
        await this.handleFeedbackInput(phoneNumber, content);
        break;

      case SessionState.VIEWING_ORDER_HISTORY:
        await this.handleReorderSelection(phoneNumber, content);
        break;

      case SessionState.SELECTING_REORDER:
        await this.handleReorderConfirmation(phoneNumber, content);
        break;

      default:
        await this.showMainMenu(phoneNumber);
    }
  }

  async showMainMenu(phoneNumber: string): Promise<void> {
    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.MAIN_MENU,
    );

    await this.whatsappApi.sendListMessage(
      phoneNumber,
      'Welcome to our store! 🛒\n\nHow can I help you today?',
      'Select Option',
      [
        {
          rows: [
            {
              id: 'browse_categories',
              title: '📂 Browse Categories',
              description: 'View products by category',
            },
            {
              id: 'search_products',
              title: '🔍 Search Products',
              description: 'Search for specific items',
            },
            {
              id: 'search_by_code',
              title: '🔢 Search by Code',
              description: 'Enter product code directly',
            },
            {
              id: 'view_cart',
              title: '🛒 View Cart',
              description: 'Review your shopping cart',
            },
            {
              id: 'track_order',
              title: '📦 Track Order',
              description: 'Check your order status',
            },
            {
              id: 'rate_order',
              title: '⭐ Rate Order',
              description: 'Rate your delivered orders',
            },
            {
              id: 'quick_reorder',
              title: '🔄 Quick Reorder',
              description: 'Reorder from your history',
            },
          ],
        },
      ],
      '🏪 Main Menu',
    );
  }

  private async handleMainMenu(
    phoneNumber: string,
    choice: string,
  ): Promise<void> {
    switch (choice) {
      case 'browse_categories':
        await this.showCategories(phoneNumber);
        break;

      case 'search_products':
        await this.initiateSearch(phoneNumber);
        break;

      case 'search_by_code':
        await this.initiateCodeSearch(phoneNumber);
        break;

      case 'view_cart':
        await this.showCart(phoneNumber);
        break;

      case 'track_order':
        await this.showOrderTracking(phoneNumber);
        break;

      case 'rate_order':
        await this.showOrdersForRating(phoneNumber);
        break;

      case 'quick_reorder':
        await this.showOrderHistory(phoneNumber);
        break;

      case 'checkout':
        await this.initiateCheckout(phoneNumber);
        break;

      case 'continue_shopping':
        await this.showMainMenu(phoneNumber);
        break;

      default:
        await this.whatsappApi.sendTextMessage(
          phoneNumber,
          'Invalid option. Please select from the menu.',
        );
        await this.showMainMenu(phoneNumber);
    }
  }

  private async showCategories(phoneNumber: string): Promise<void> {
    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.BROWSING_CATEGORIES,
    );

    // Get categories from Common entity where type = 'ITEM_CATEGORY'
    const categories = await this.commonService.findAll();
    const itemCategories = categories.filter((c) => c.type === 'ITEM_CATEGORY');

    if (itemCategories.length === 0) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'No categories available at the moment. Type "menu" to return to main menu.',
      );
      return;
    }

    // Limit to 9 categories to leave room for back button (WhatsApp limit is 10 rows)
    const rows = itemCategories.slice(0, 9).map((cat) => ({
      id: `cat_${cat.id}`,
      title: cat.description.substring(0, 24),
      description: cat.code,
    }));

    // Add back button
    rows.push({
      id: 'back_to_menu',
      title: '⬅️ Back to Menu',
      description: 'Return to main menu',
    });

    await this.whatsappApi.sendListMessage(
      phoneNumber,
      'Please select a category to browse products:',
      'Select Category',
      [{ rows }],
      '📂 Categories',
    );
  }

  private async handleCategorySelection(
    phoneNumber: string,
    choice: string,
  ): Promise<void> {
    if (choice === 'back_to_menu') {
      return this.showMainMenu(phoneNumber);
    }

    const categoryId = parseInt(choice.replace('cat_', ''));
    if (isNaN(categoryId)) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'Invalid category selection.',
      );
      return this.showCategories(phoneNumber);
    }

    await this.showItemsInCategory(phoneNumber, categoryId);
  }

  private async showItemsInCategory(
    phoneNumber: string,
    categoryId: number,
  ): Promise<void> {
    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.VIEWING_ITEMS,
      {
        selectedCategoryId: categoryId,
      },
    );

    const items = await this.itemService.findAll();
    const categoryItems = items.filter(
      (item) => item.category?.id === categoryId,
    );

    if (categoryItems.length === 0) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'No items found in this category. Type "menu" to return to main menu.',
      );
      return;
    }

    const rows: Array<{ id: string; title: string; description?: string }> = [];
    // Limit to 9 items to leave room for back button (WhatsApp limit is 10 rows)
    for (const item of categoryItems.slice(0, 9)) {
      const activePrice = item.prices?.find((p) => p.isActive);
      const stock = item.stock?.[0];
      const stockInfo = stock ? `Stock: ${stock.quantity}` : 'Out of stock';

      rows.push({
        id: `item_${item.id}`,
        title: item.name.substring(0, 24),
        description: `${activePrice ? `TZS ${activePrice.sellingPrice}` : 'Price N/A'} | ${stockInfo}`,
      });
    }

    rows.push({
      id: 'back_to_categories',
      title: '⬅️ Back',
      description: 'Return to categories',
    });

    await this.whatsappApi.sendListMessage(
      phoneNumber,
      'Select an item to add to your cart:',
      'Select Item',
      [{ rows }],
      '📦 Products',
    );
  }

  private async handleItemSelection(
    phoneNumber: string,
    choice: string,
  ): Promise<void> {
    if (choice === 'back_to_categories') {
      return this.showCategories(phoneNumber);
    }

    const itemId = parseInt(choice.replace('item_', ''));
    if (isNaN(itemId)) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'Invalid item selection.',
      );
      return;
    }

    await this.requestQuantity(phoneNumber, itemId);
  }

  private async requestQuantity(
    phoneNumber: string,
    itemId: number,
  ): Promise<void> {
    const item = await this.itemService.findOne(itemId);
    if (!item) {
      await this.whatsappApi.sendTextMessage(phoneNumber, 'Item not found.');
      return this.showMainMenu(phoneNumber);
    }

    const activePrice = item.prices?.find((p) => p.isActive);
    const stock = item.stock?.[0];

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.ADDING_TO_CART,
      {
        selectedItemId: itemId,
      },
    );

    const conditionBadge = item.condition === 'used' ? '🔄 Used' : '✨ New';
    const productDetails =
      `📦 *${item.name}*\n` +
      `${conditionBadge}\n` +
      `💰 Price: TZS ${activePrice?.sellingPrice || 'N/A'}\n` +
      `📊 Available: ${stock?.quantity || 0} units\n\n` +
      `Please enter the quantity you want to order (or type "cancel" to go back):`;

    this.logger.log(`Request Quantity - Item: ${item.name}, Has image: ${!!item.imageUrl}, Image URL: ${item.imageUrl || 'none'}`);

    // Send image with caption if available, otherwise send text only
    if (item.imageUrl) {
      this.logger.log(`Sending product with image: ${item.name}`);
      await this.whatsappApi.sendImageMessage(
        phoneNumber,
        item.imageUrl,
        productDetails,
      );
    } else {
      this.logger.log(`Sending product without image (text only): ${item.name}`);
      await this.whatsappApi.sendTextMessage(phoneNumber, productDetails);
    }
  }

  private async handleAddToCart(
    phoneNumber: string,
    content: string,
  ): Promise<void> {
    if (content.toLowerCase() === 'cancel') {
      return this.showMainMenu(phoneNumber);
    }

    const quantity = parseInt(content);
    if (isNaN(quantity) || quantity <= 0) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'Please enter a valid quantity (positive number):',
      );
      return;
    }

    const session = await this.sessionService.getOrCreateSession(phoneNumber);
    const itemId = session.context?.selectedItemId;


    console.log("the selected item is: "+ itemId);

    if (!itemId) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'Session expired. Please start again.',
      );
      return this.showMainMenu(phoneNumber);
    }

    const item = await this.itemService.findOne(itemId);
    const activePrice = item.prices?.find((p) => p.isActive);
    const stock = item.stock?.[0];

    console.log('##############################');
    console.log(stock);
    console.log(activePrice);

    // Check stock availability
    if (!stock || stock.quantity < quantity) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        `Sorry, only ${stock?.quantity || 0} units available. Please enter a lower quantity:`,
      );
      return;
    }

    const cartItem: CartItem = {
      itemId: item.id,
      itemName: item.name,
      quantity,
      unitPrice: activePrice?.sellingPrice || 0,
      totalPrice: (activePrice?.sellingPrice || 0) * quantity,
      warehouseId: stock?.warehouse?.id || 1, // Use stock's warehouse
    };

    await this.sessionService.addToCart(phoneNumber, cartItem);

    await this.whatsappApi.sendButtonMessage(
      phoneNumber,
      `✅ Added ${quantity} x ${item.name} to your cart!\n\n` +
        `What would you like to do next?`,
      [
        { id: 'continue_shopping', title: '🛍️ Continue Shopping' },
        { id: 'view_cart', title: '🛒 View Cart' },
        { id: 'checkout', title: '✔️ Checkout' },
      ],
    );

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.MAIN_MENU,
    );
  }

  private async initiateSearch(phoneNumber: string): Promise<void> {
    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.SEARCHING,
    );
    await this.whatsappApi.sendTextMessage(
      phoneNumber,
      '🔍 Search for products\n\nPlease enter the product name you are looking for (or type "cancel" to go back):',
    );
  }

  private async handleSearch(
    phoneNumber: string,
    query: string,
  ): Promise<void> {
    if (query.toLowerCase() === 'cancel') {
      return this.showMainMenu(phoneNumber);
    }

    const allItems = await this.itemService.findAll();
    const searchResults = allItems.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase()),
    );

    if (searchResults.length === 0) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        `No products found matching "${query}". Please try a different search term or type "menu" to return to main menu.`,
      );
      return;
    }

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.VIEWING_ITEMS,
      {
        searchQuery: query,
      },
    );

    // Limit to 9 items to leave room for back button (WhatsApp limit is 10 rows)
    const rows = searchResults.slice(0, 9).map((item) => {
      const activePrice = item.prices?.find((p) => p.isActive);
      const stock = item.stock?.[0];
      const stockInfo = stock ? `Stock: ${stock.quantity}` : 'Out of stock';

      return {
        id: `item_${item.id}`,
        title: item.name.substring(0, 24),
        description: `${activePrice ? `TZS ${activePrice.sellingPrice}` : 'Price N/A'} | ${stockInfo}`,
      };
    });

    rows.push({
      id: 'back_to_menu',
      title: '⬅️ Back to Menu',
      description: 'Return to main menu',
    });

    await this.whatsappApi.sendListMessage(
      phoneNumber,
      `Found ${searchResults.length} product(s) matching "${query}":`,
      'Select Item',
      [{ rows }],
      '🔍 Search Results',
    );
  }

  private async initiateCodeSearch(phoneNumber: string): Promise<void> {
    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.SEARCHING_BY_CODE,
    );
    await this.whatsappApi.sendTextMessage(
      phoneNumber,
      '🔢 Search by Product Code\n\nPlease enter the product code (or type "cancel" to go back):',
    );
  }

  private async handleCodeSearch(
    phoneNumber: string,
    code: string,
  ): Promise<void> {
    if (code.toLowerCase() === 'cancel') {
      return this.showMainMenu(phoneNumber);
    }

    const allItems = await this.itemService.findAll();
    const item = allItems.find(
      (item) => item.code && item.code.toLowerCase() === code.toLowerCase(),
    );

    if (!item) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        `❌ No product found with code "${code}".\n\nPlease check the code and try again, or type "menu" to return to main menu.`,
      );
      return;
    }

    // Product found - show details and ask for quantity
    const activePrice = item.prices?.find((p) => p.isActive);
    const stock = item.stock?.[0];

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.ADDING_TO_CART,
      {
        selectedItemId: item.id,
      },
    );

    const conditionBadge = item.condition === 'used' ? '🔄 Used' : '✨ New';
    const productDetails =
      `✅ Product Found!\n\n` +
      `📦 ${item.name}\n` +
      `${conditionBadge}\n` +
      `🔢 Code: ${item.code}\n` +
      `💰 Price: TZS ${activePrice?.sellingPrice || 'N/A'}\n` +
      `📊 Available: ${stock?.quantity || 0} units\n` +
      `${item.desc ? `\n📝 ${item.desc}\n` : ''}\n` +
      `Please enter the quantity you want to order (or type "cancel" to go back):`;

    this.logger.log(`Product Code Entry - Item: ${item.name}, Has image: ${!!item.imageUrl}, Image URL: ${item.imageUrl || 'none'}`);

    // Send image with caption if available, otherwise send text only
    if (item.imageUrl) {
      this.logger.log(`Sending product with image (code entry): ${item.name}`);
      await this.whatsappApi.sendImageMessage(
        phoneNumber,
        item.imageUrl,
        productDetails,
      );
    } else {
      this.logger.log(`Sending product without image (code entry, text only): ${item.name}`);
      await this.whatsappApi.sendTextMessage(phoneNumber, productDetails);
    }
  }

  private async showCart(phoneNumber: string): Promise<void> {
    const cart = await this.sessionService.getCart(phoneNumber);

    if (cart.length === 0) {
      await this.whatsappApi.sendButtonMessage(
        phoneNumber,
        '🛒 Your cart is empty.\n\nStart shopping to add items!',
        [
          { id: 'browse_categories', title: '📂 Browse Products' },
          { id: 'search_products', title: '🔍 Search' },
        ],
      );
      await this.sessionService.updateSessionState(
        phoneNumber,
        SessionState.MAIN_MENU,
      );
      return;
    }

    let cartMessage = '🛒 Your Shopping Cart\n\n';
    let total = 0;

    cart.forEach((item, index) => {
      cartMessage += `${index + 1}. ${item.itemName}\n`;
      cartMessage += `   Qty: ${item.quantity} x TZS ${item.unitPrice} = TZS ${item.totalPrice}\n\n`;
      total += item.totalPrice;
    });

    cartMessage += `━━━━━━━━━━━━━━━━\n`;
    cartMessage += `💰 Total: TZS ${total.toFixed(2)}`;

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.CART_REVIEW,
    );

    await this.whatsappApi.sendButtonMessage(phoneNumber, cartMessage, [
      { id: 'checkout', title: '✔️ Checkout' },
      { id: 'clear_cart', title: '🗑️ Clear Cart' },
      { id: 'back_to_menu', title: '⬅️ Back' },
    ]);
  }

  private async handleCartReview(
    phoneNumber: string,
    choice: string,
  ): Promise<void> {
    switch (choice) {
      case 'checkout':
        await this.initiateCheckout(phoneNumber);
        break;

      case 'clear_cart':
        await this.sessionService.clearCart(phoneNumber);
        await this.whatsappApi.sendTextMessage(
          phoneNumber,
          '🗑️ Cart cleared successfully!',
        );
        await this.showMainMenu(phoneNumber);
        break;

      case 'back_to_menu':
      case 'continue_shopping':
        await this.showMainMenu(phoneNumber);
        break;

      default:
        await this.showCart(phoneNumber);
    }
  }

  private async initiateCheckout(phoneNumber: string): Promise<void> {
    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.ENTERING_ADDRESS,
    );
    await this.whatsappApi.sendTextMessage(
      phoneNumber,
      '📍 Please enter your delivery address:\n\n(Or type "skip" to use phone number as reference)',
    );
  }

  private async handleAddressEntry(
    phoneNumber: string,
    address: string,
  ): Promise<void> {
    const deliveryAddress = address.toLowerCase() === 'skip' ? '' : address;

    await this.sessionService.updateContext(phoneNumber, { deliveryAddress });
    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.CONFIRMING_ORDER,
    );

    const cart = await this.sessionService.getCart(phoneNumber);
    let total = 0;
    let orderSummary = '📋 Order Summary\n\n';

    cart.forEach((item, index) => {
      orderSummary += `${index + 1}. ${item.itemName}\n`;
      orderSummary += `   ${item.quantity} x TZS ${item.unitPrice} = TZS ${item.totalPrice}\n\n`;
      total += item.totalPrice;
    });

    orderSummary += `━━━━━━━━━━━━━━━━\n`;
    orderSummary += `💰 Total: TZS ${total.toFixed(2)}\n\n`;
    if (deliveryAddress) {
      orderSummary += `📍 Delivery: ${deliveryAddress}\n\n`;
    }
    orderSummary += `Confirm your order?`;

    await this.whatsappApi.sendButtonMessage(phoneNumber, orderSummary, [
      { id: 'confirm_order', title: '✅ Confirm' },
      { id: 'cancel_order', title: '❌ Cancel' },
    ]);
  }

  private async handleOrderConfirmation(
    phoneNumber: string,
    choice: string,
  ): Promise<void> {
    if (choice === 'cancel_order') {
      await this.whatsappApi.sendTextMessage(phoneNumber, 'Order cancelled.');
      return this.showMainMenu(phoneNumber);
    }

    if (choice === 'confirm_order') {
      const session = await this.sessionService.getOrCreateSession(phoneNumber);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cart = session.context?.cart || [];
      const deliveryAddress = session.context?.deliveryAddress || '';

      if (cart.length === 0) {
        await this.whatsappApi.sendTextMessage(
          phoneNumber,
          'Your cart is empty.',
        );
        return this.showMainMenu(phoneNumber);
      }

      try {
        // Create order - use warehouse from first cart item
        const warehouseId = cart[0]?.warehouseId || 1;
        const order = await this.orderService.createOrder({
          customerPhone: phoneNumber,
          warehouseId,
          items: cart.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
          deliveryAddress,
        });

        // Clear cart
        await this.sessionService.clearCart(phoneNumber);

        await this.whatsappApi.sendTextMessage(
          phoneNumber,
          `✅ Order Confirmed!\n\n` +
            `Order #${order.orderNumber}\n` +
            `Total: TZS ${order.totalAmount}\n` +
            `Status: ${order.status}\n\n` +
            `We'll notify you when your order is ready for delivery!`,
        );

        await this.sessionService.updateSessionState(
          phoneNumber,
          SessionState.MAIN_MENU,
        );
      } catch (error) {
        this.logger.error('Error creating order:', error);
        await this.whatsappApi.sendTextMessage(
          phoneNumber,
          '❌ Failed to create order. Some items may be out of stock. Please try again or contact support.',
        );
        await this.showMainMenu(phoneNumber);
      }
    }
  }

  private async showOrderTracking(phoneNumber: string): Promise<void> {
    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.TRACKING_ORDER,
    );

    const orders = await this.orderService.findByPhone(phoneNumber);

    if (orders.length === 0) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        '📦 No orders found.\n\nType "menu" to return to main menu.',
      );
      await this.sessionService.updateSessionState(
        phoneNumber,
        SessionState.MAIN_MENU,
      );
      return;
    }

    const recentOrders = orders.slice(0, 5); // Show last 5 orders
    const rows = recentOrders.map((order) => ({
      id: `order_${order.id}`,
      title: `#${order.orderNumber}`,
      description: `${order.status} | TZS ${order.totalAmount} | ${new Date(order.createdAt).toLocaleDateString()}`,
    }));

    rows.push({
      id: 'back_to_menu',
      title: '⬅️ Back to Menu',
      description: 'Return to main menu',
    });

    await this.whatsappApi.sendListMessage(
      phoneNumber,
      'Select an order to view details:',
      'View Order',
      [{ rows }],
      '📦 Your Orders',
    );
  }

  private async handleOrderTracking(
    phoneNumber: string,
    choice: string,
  ): Promise<void> {
    if (choice === 'back_to_menu') {
      return this.showMainMenu(phoneNumber);
    }

    const orderId = parseInt(choice.replace('order_', ''));
    if (isNaN(orderId)) {
      return this.showOrderTracking(phoneNumber);
    }

    const order = await this.orderService.findOne(orderId);
    if (!order || order.customerPhone !== phoneNumber) {
      await this.whatsappApi.sendTextMessage(phoneNumber, 'Order not found.');
      return this.showOrderTracking(phoneNumber);
    }

    let orderDetails = `📦 Order Details\n\n`;
    orderDetails += `Order #${order.orderNumber}\n`;
    orderDetails += `Status: ${order.status.toUpperCase()}\n`;
    orderDetails += `Date: ${new Date(order.createdAt).toLocaleString()}\n\n`;

    orderDetails += `Items:\n`;
    order.items.forEach((item, index) => {
      orderDetails += `${index + 1}. ${item.item.name}\n`;
      orderDetails += `   ${item.quantity} x TZS ${item.unitPrice} = TZS ${item.totalPrice}\n`;
    });

    orderDetails += `\n━━━━━━━━━━━━━━━━\n`;
    orderDetails += `💰 Total: TZS ${order.totalAmount}\n`;

    if (order.deliveryAddress) {
      orderDetails += `\n📍 Delivery: ${order.deliveryAddress}`;
    }

    await this.whatsappApi.sendButtonMessage(phoneNumber, orderDetails, [
      { id: 'track_order', title: '📦 My Orders' },
      { id: 'back_to_menu', title: '⬅️ Main Menu' },
    ]);

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.MAIN_MENU,
    );
  }

  private async showHelp(phoneNumber: string): Promise<void> {
    const helpMessage =
      '❓ Help & Commands\n\n' +
      '🔹 Type "menu" - Show main menu\n' +
      '🔹 Type "cart" - View your cart\n' +
      '🔹 Type "track" - Track your orders\n' +
      '🔹 Type "help" - Show this help message\n\n' +
      'Need assistance? Contact our support team!';

    await this.whatsappApi.sendTextMessage(phoneNumber, helpMessage);
  }

  /**
   * Generate WhatsApp click-to-chat link for a product
   */
  async generateProductLink(itemId: number): Promise<any> {
    try {
      // Get item details
      const item = await this.itemService.findOne(itemId);
      if (!item) {
        throw new NotFoundException(`Product with ID ${itemId} not found`);
      }

      // Get active price and stock
      const activePrice = item.prices?.find((p) => p.isActive);
      const stock = item.stock?.[0];

      // For click-to-chat, we need the actual phone number (not Phone Number ID)
      // Format: country code + number (e.g., 255676107301 for Tanzania)
      const businessPhone = '255676107301'; // Your actual business WhatsApp number

      // Generate pre-filled message
      const message = `ORDER:${item.id}`;
      const encodedMessage = encodeURIComponent(message);

      // Generate WhatsApp link
      const whatsappLink = `https://wa.me/${businessPhone}?text=${encodedMessage}`;

      return {
        success: true,
        item: {
          id: item.id,
          name: item.name,
          code: item.code,
          price: activePrice?.sellingPrice || 0,
          stock: stock?.quantity || 0,
        },
        whatsappLink,
        shortMessage: message,
        instructions: 'Click the link to open WhatsApp and start ordering this product',
      };
    } catch (error) {
      this.logger.error(`Error generating product link: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle quick order from WhatsApp link
   */
  private async handleQuickOrder(
    phoneNumber: string,
    productIdentifier: string,
  ): Promise<void> {
    try {
      this.logger.log(`Quick order request for: ${productIdentifier} from ${phoneNumber}`);

      // Try to find item by ID or code
      let item;
      const itemId = parseInt(productIdentifier);

      if (!isNaN(itemId)) {
        // Search by ID
        item = await this.itemService.findOne(itemId);
      } else {
        // Search by code
        const items = await this.itemService.findAll();
        item = items.find((i) => i.code?.toLowerCase() === productIdentifier.toLowerCase());
      }

      if (!item) {
        await this.whatsappApi.sendTextMessage(
          phoneNumber,
          `Sorry, product "${productIdentifier}" not found.\n\nType *menu* to browse our catalog.`
        );
        return this.showMainMenu(phoneNumber);
      }

      // Get product details
      const activePrice = item.prices?.find((p) => p.isActive);
      const stock = item.stock?.[0];

      const conditionBadge = item.condition === 'used' ? '🔄 Used' : '✨ New';
      const productDetails =
        `🎯 Quick Order\n\n` +
        `📦 *${item.name}*\n` +
        `${conditionBadge}\n` +
        `🔖 Code: ${item.code || 'N/A'}\n` +
        `💰 Price: TZS ${activePrice?.sellingPrice || 'N/A'}\n` +
        `📊 Available: ${stock?.quantity || 0} units\n\n` +
        `Please enter the quantity you want to order (or type "cancel" to exit):`;

      this.logger.log(`Quick Order - Item: ${item.name}, Has image: ${!!item.imageUrl}, Image URL: ${item.imageUrl || 'none'}`);

      // Send image with caption if available, otherwise send text only
      if (item.imageUrl) {
        this.logger.log(`Sending product with image for quick order: ${item.name}`);
        await this.whatsappApi.sendImageMessage(
          phoneNumber,
          item.imageUrl,
          productDetails,
        );
      } else {
        this.logger.log(`Sending product without image (text only) for quick order: ${item.name}`);
        await this.whatsappApi.sendTextMessage(phoneNumber, productDetails);
      }

      // Set session to add to cart state with selected item
      await this.sessionService.updateSessionState(
        phoneNumber,
        SessionState.ADDING_TO_CART,
        {
          selectedItemId: item.id,
        },
      );
    } catch (error) {
      this.logger.error(`Error handling quick order: ${error.message}`, error.stack);
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'Sorry, something went wrong. Please try again or type "menu".',
      );
    }
  }

  private async ensureCustomerExists(
    phoneNumber: string,
    name?: string,
  ): Promise<void> {
    try {
      const customers = await this.customerService.findAll();
      const existingCustomer = customers.find((c) => c.phone === phoneNumber);

      if (!existingCustomer) {
        await this.customerService.create({
          name: name || `Customer ${phoneNumber}`,
          phone: phoneNumber,
        });
        this.logger.log(`Created new customer for ${phoneNumber}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to create customer: ${error.message}`);
    }
  }

  // ========== RATING & FEEDBACK FLOW ==========

  private async showOrdersForRating(phoneNumber: string): Promise<void> {
    this.logger.log(`Showing orders for rating to ${phoneNumber}`);

    const unratedOrders = await this.orderService.getDeliveredOrdersForRating(phoneNumber);

    if (unratedOrders.length === 0) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        '🎉 Great news! You have no pending orders to rate.\n\nAll your delivered orders have been rated. Thank you for your feedback!',
      );
      return this.showMainMenu(phoneNumber);
    }

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.RATING_ORDER,
      { unratedOrders: unratedOrders.map((o) => o.id) },
    );

    let message = '⭐ *Rate Your Orders*\n\n';
    message += 'Please select an order to rate:\n\n';

    unratedOrders.forEach((order, index) => {
      const orderDate = new Date(order.deliveredAt).toLocaleDateString();
      message += `${index + 1}. Order #${order.orderNumber}\n`;
      message += `   📅 Delivered: ${orderDate}\n`;
      message += `   💰 Total: TZS ${order.totalAmount}\n`;
      message += `   📦 Items: ${order.items.length}\n\n`;
    });

    message += 'Type the number (1-' + unratedOrders.length + ') or "cancel" to go back:';

    await this.whatsappApi.sendTextMessage(phoneNumber, message);
  }

  private async handleRatingSelection(phoneNumber: string, content: string): Promise<void> {
    if (content.toLowerCase() === 'cancel') {
      return this.showMainMenu(phoneNumber);
    }

    const session = await this.sessionService.getOrCreateSession(phoneNumber);
    const unratedOrderIds = session.context?.unratedOrders || [];

    // Check if user is selecting a star rating (1-5)
    if (session.context?.selectedOrderForRating) {
      const rating = parseInt(content);

      if (isNaN(rating) || rating < 1 || rating > 5) {
        await this.whatsappApi.sendTextMessage(
          phoneNumber,
          '❌ Please enter a valid rating between 1 and 5 stars.',
        );
        return;
      }

      const orderId = session.context.selectedOrderForRating;

      await this.sessionService.updateSessionState(
        phoneNumber,
        SessionState.PROVIDING_FEEDBACK,
        {
          orderId,
          rating,
        },
      );

      const stars = '⭐'.repeat(rating);
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        `${stars} You rated this order ${rating}/5 stars!\n\n` +
          '💬 Would you like to add feedback? (optional)\n\n' +
          'Type your feedback or "skip" to finish:',
      );
      return;
    }

    // User is selecting which order to rate
    const orderIndex = parseInt(content) - 1;

    if (isNaN(orderIndex) || orderIndex < 0 || orderIndex >= unratedOrderIds.length) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        `❌ Please enter a valid number between 1 and ${unratedOrderIds.length}.`,
      );
      return;
    }

    const selectedOrderId = unratedOrderIds[orderIndex];
    const order = await this.orderService.findOne(selectedOrderId);

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.RATING_ORDER,
      {
        ...session.context,
        selectedOrderForRating: selectedOrderId,
      },
    );

    let message = `📦 *Order #${order.orderNumber}*\n\n`;
    message += '🛍️ Items:\n';
    order.items.forEach((item) => {
      message += `• ${item.item.name} x${item.quantity}\n`;
    });
    message += `\n💰 Total: TZS ${order.totalAmount}\n\n`;
    message += '⭐ *How would you rate this order?*\n\n';
    message += 'Please rate from 1 to 5 stars:\n';
    message += '1 ⭐ - Very Poor\n';
    message += '2 ⭐⭐ - Poor\n';
    message += '3 ⭐⭐⭐ - Average\n';
    message += '4 ⭐⭐⭐⭐ - Good\n';
    message += '5 ⭐⭐⭐⭐⭐ - Excellent\n\n';
    message += 'Type a number (1-5) or "cancel":';

    await this.whatsappApi.sendTextMessage(phoneNumber, message);
  }

  private async handleFeedbackInput(phoneNumber: string, content: string): Promise<void> {
    const session = await this.sessionService.getOrCreateSession(phoneNumber);
    const orderId = session.context?.orderId;
    const rating = session.context?.rating;

    if (!orderId || !rating) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        '❌ Session expired. Please start rating again.',
      );
      return this.showMainMenu(phoneNumber);
    }

    const feedback = content.toLowerCase() === 'skip' ? undefined : content;

    try {
      await this.orderService.rateOrder(orderId, rating, feedback);

      const stars = '⭐'.repeat(rating);
      let message = `${stars} Thank you for your ${rating}-star rating!\n\n`;

      if (feedback) {
        message += '💬 Your feedback has been recorded.\n\n';
      }

      message += '🙏 We appreciate your feedback and will use it to improve our service!\n\n';
      message += 'Type "menu" to return to the main menu.';

      await this.whatsappApi.sendTextMessage(phoneNumber, message);

      // Check if there are more orders to rate
      const unratedOrders = await this.orderService.getDeliveredOrdersForRating(phoneNumber);

      if (unratedOrders.length > 0) {
        await this.whatsappApi.sendTextMessage(
          phoneNumber,
          `📝 You have ${unratedOrders.length} more order(s) to rate.\n\nType "rate" to continue rating or "menu" for main menu.`,
        );
      }

      await this.sessionService.updateSessionState(phoneNumber, SessionState.MAIN_MENU);
    } catch (error) {
      this.logger.error(`Error saving rating: ${error.message}`, error.stack);
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        '❌ Sorry, there was an error saving your rating. Please try again later.',
      );
      return this.showMainMenu(phoneNumber);
    }
  }

  // ========== QUICK REORDER FLOW ==========

  private async showOrderHistory(phoneNumber: string): Promise<void> {
    this.logger.log(`Showing order history for ${phoneNumber}`);

    const orders = await this.orderService.getOrderHistory(phoneNumber, 10);

    if (orders.length === 0) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        '📭 You have no previous orders yet.\n\nStart shopping to build your order history!',
      );
      return this.showMainMenu(phoneNumber);
    }

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.VIEWING_ORDER_HISTORY,
      { orderHistory: orders.map((o) => o.id) },
    );

    let message = '🔄 *Quick Reorder*\n\n';
    message += 'Select an order to reorder:\n\n';

    orders.forEach((order, index) => {
      const orderDate = new Date(order.createdAt).toLocaleDateString();
      const statusEmoji = order.status === 'delivered' ? '✅' : order.status === 'cancelled' ? '❌' : '⏳';

      message += `${index + 1}. ${statusEmoji} Order #${order.orderNumber}\n`;
      message += `   📅 Date: ${orderDate}\n`;
      message += `   💰 Total: TZS ${order.totalAmount}\n`;
      message += `   📦 Items: ${order.items.map(item => `${item.item.name} x${item.quantity}`).join(', ')}\n\n`;
    });

    message += 'Type the number (1-' + orders.length + ') to reorder, or "cancel":';

    await this.whatsappApi.sendTextMessage(phoneNumber, message);
  }

  private async handleReorderSelection(phoneNumber: string, content: string): Promise<void> {
    if (content.toLowerCase() === 'cancel') {
      return this.showMainMenu(phoneNumber);
    }

    const session = await this.sessionService.getOrCreateSession(phoneNumber);
    const orderHistoryIds = session.context?.orderHistory || [];

    const orderIndex = parseInt(content) - 1;

    if (isNaN(orderIndex) || orderIndex < 0 || orderIndex >= orderHistoryIds.length) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        `❌ Please enter a valid number between 1 and ${orderHistoryIds.length}.`,
      );
      return;
    }

    const selectedOrderId = orderHistoryIds[orderIndex];
    const order = await this.orderService.findOne(selectedOrderId);

    await this.sessionService.updateSessionState(
      phoneNumber,
      SessionState.SELECTING_REORDER,
      {
        reorderFromId: selectedOrderId,
      },
    );

    let message = `🔄 *Reorder Confirmation*\n\n`;
    message += `📦 Order #${order.orderNumber}\n\n`;
    message += '🛍️ Items to be added to your cart:\n\n';

    order.items.forEach((item) => {
      message += `• ${item.item.name}\n`;
      message += `  Qty: ${item.quantity} × TZS ${item.unitPrice} = TZS ${item.totalPrice}\n\n`;
    });

    message += `💰 Total: TZS ${order.totalAmount}\n\n`;
    message += '✅ Type "confirm" to add these items to your cart\n';
    message += '❌ Type "cancel" to go back';

    await this.whatsappApi.sendTextMessage(phoneNumber, message);
  }

  private async handleReorderConfirmation(phoneNumber: string, content: string): Promise<void> {
    if (content.toLowerCase() === 'cancel') {
      return this.showMainMenu(phoneNumber);
    }

    if (content.toLowerCase() !== 'confirm') {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        'Please type "confirm" to proceed with the reorder, or "cancel" to go back.',
      );
      return;
    }

    const session = await this.sessionService.getOrCreateSession(phoneNumber);
    const reorderFromId = session.context?.reorderFromId;

    if (!reorderFromId) {
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        '❌ Session expired. Please start reorder again.',
      );
      return this.showMainMenu(phoneNumber);
    }

    try {
      const reorderDto = await this.orderService.reorderFromPreviousOrder(
        reorderFromId,
        phoneNumber,
      );

      // Get current cart
      let cart = await this.sessionService.getCart(phoneNumber);

      // Add items from previous order to cart
      for (const item of reorderDto.items) {
        const itemDetails = await this.itemService.findOne(item.itemId);
        const activePrice = itemDetails.prices?.find((p) => p.isActive);

        const existingItemIndex = cart.findIndex((cartItem) => cartItem.itemId === item.itemId);

        if (existingItemIndex >= 0) {
          cart[existingItemIndex].quantity += item.quantity;
          cart[existingItemIndex].totalPrice =
            cart[existingItemIndex].quantity * cart[existingItemIndex].unitPrice;
        } else {
          cart.push({
            itemId: item.itemId,
            itemName: itemDetails.name,
            quantity: item.quantity,
            unitPrice: activePrice?.sellingPrice || 0,
            totalPrice: item.quantity * (activePrice?.sellingPrice || 0),
            warehouseId: reorderDto.warehouseId,
          });
        }
      }

      await this.sessionService.updateContext(phoneNumber, { cart });

      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        `✅ *Reorder Successful!*\n\n${reorderDto.items.length} items have been added to your cart.\n\nType "cart" to review your cart or "menu" for main menu.`,
      );

      await this.sessionService.updateSessionState(phoneNumber, SessionState.MAIN_MENU);
    } catch (error) {
      this.logger.error(`Error processing reorder: ${error.message}`, error.stack);
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        '❌ Sorry, there was an error processing your reorder. Some items may be out of stock. Please try again.',
      );
      return this.showMainMenu(phoneNumber);
    }
  }
}
