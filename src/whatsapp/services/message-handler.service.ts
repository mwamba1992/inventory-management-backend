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

      case 'checkout':
        await this.initiateCheckout(phoneNumber);
        break;

      case 'continue_shopping':
        await this.showMainMenu(phoneNumber);
        break;

      case 'track_order':
        await this.showOrderTracking(phoneNumber);
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

    await this.whatsappApi.sendTextMessage(
      phoneNumber,
      `📦 ${item.name}\n` +
        `💰 Price: TZS ${activePrice?.sellingPrice || 'N/A'}\n` +
        `📊 Available: ${stock?.quantity || 0} units\n\n` +
        `Please enter the quantity you want to order (or type "cancel" to go back):`,
    );
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

    await this.whatsappApi.sendTextMessage(
      phoneNumber,
      `✅ Product Found!\n\n` +
        `📦 ${item.name}\n` +
        `🔢 Code: ${item.code}\n` +
        `💰 Price: TZS ${activePrice?.sellingPrice || 'N/A'}\n` +
        `📊 Available: ${stock?.quantity || 0} units\n` +
        `${item.desc ? `\n📝 ${item.desc}\n` : ''}\n` +
        `Please enter the quantity you want to order (or type "cancel" to go back):`,
    );
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
            `We'll notify you when your order is ready for delivery!\n\n` +
            `Type "track" to track your order or "menu" for main menu.`,
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

      // Send product info and ask for quantity
      await this.whatsappApi.sendTextMessage(
        phoneNumber,
        `🎯 Quick Order\n\n` +
        `📦 *${item.name}*\n` +
        `🔖 Code: ${item.code || 'N/A'}\n` +
        `💰 Price: TZS ${activePrice?.sellingPrice || 'N/A'}\n` +
        `📊 Available: ${stock?.quantity || 0} units\n\n` +
        `Please enter the quantity you want to order (or type "cancel" to exit):`,
      );

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
}
