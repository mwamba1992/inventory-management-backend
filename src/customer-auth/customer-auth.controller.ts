import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { WhatsAppOrderService } from '../whatsapp/services/whatsapp-order.service';

@ApiTags('Customer Authentication')
@Controller('customer-auth')
export class CustomerAuthController {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly orderService: WhatsAppOrderService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new customer',
    description: 'Create a new customer account with phone and password. Returns JWT token for authentication.',
  })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  @ApiResponse({ status: 409, description: 'Customer already exists' })
  async register(@Body() dto: CustomerRegisterDto) {
    const result = await this.customerAuthService.register(dto);
    return {
      success: true,
      message: 'Account created successfully!',
      ...result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login customer',
    description: 'Login with phone number and password. Returns JWT token.',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: CustomerLoginDto) {
    const result = await this.customerAuthService.login(dto);
    return {
      success: true,
      message: 'Login successful!',
      ...result,
    };
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set password for existing customer',
    description: 'For customers who placed orders via checkout but never set a password. They can use this to set their password and start logging in.',
  })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 400, description: 'Password already set' })
  async setPassword(@Body() dto: SetPasswordDto) {
    const result = await this.customerAuthService.setPassword(dto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get customer profile',
    description: 'Get the logged-in customer\'s profile information. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getProfile(@Request() req) {
    const customer = await this.customerAuthService.getProfile(req.customer.id);
    return {
      success: true,
      customer,
    };
  }

  @Put('profile')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update customer profile',
    description: 'Update the logged-in customer\'s profile (name, email, city, region). Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req, @Body() dto: UpdateCustomerProfileDto) {
    const customer = await this.customerAuthService.updateProfile(req.customer.id, dto);
    return {
      success: true,
      message: 'Profile updated successfully!',
      customer,
    };
  }

  @Post('change-password')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change customer password',
    description: 'Change password for the logged-in customer. Requires current password. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    const result = await this.customerAuthService.changePassword(req.customer.id, dto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('orders')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get customer orders',
    description: 'Get all orders for the logged-in customer, sorted by newest first. Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrders(@Request() req) {
    const orders = await this.orderService.findByPhone(req.customer.phone);

    // Format orders for customer dashboard
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderSource: order.orderSource,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      deliveredAt: order.deliveredAt,
      rating: order.rating,
      feedback: order.feedback,
      items: order.items.map(item => ({
        id: item.id,
        name: item.item.name,
        code: item.item.code,
        imageUrl: item.item.imageUrl,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    }));

    return {
      success: true,
      totalOrders: formattedOrders.length,
      orders: formattedOrders,
    };
  }

  @Get('orders/stats')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get customer order statistics',
    description: 'Get order statistics for the logged-in customer (total orders, total spent, etc.). Requires authentication.',
  })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrderStats(@Request() req) {
    const orders = await this.orderService.findByPhone(req.customer.phone);

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalSpent: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + Number(o.totalAmount), 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / orders.length
        : 0,
    };

    return {
      success: true,
      stats,
    };
  }
}
