import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Customer } from '../settings/customer/entities/customer.entity';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { Constants } from '../utils/constants';

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new customer with password
   */
  async register(dto: CustomerRegisterDto): Promise<{ customer: Partial<Customer>; access_token: string }> {
    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { phone: dto.phone },
    });

    if (existingCustomer && existingCustomer.hasPassword) {
      throw new ConflictException('Customer with this phone number already exists. Please login instead.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let customer: Customer;

    if (existingCustomer && !existingCustomer.hasPassword) {
      // Update existing customer (from checkout) with password
      existingCustomer.password = hashedPassword;
      existingCustomer.hasPassword = true;
      if (dto.email) existingCustomer.email = dto.email;
      if (dto.city) existingCustomer.city = dto.city;
      if (dto.region) existingCustomer.region = dto.region;
      customer = await this.customerRepository.save(existingCustomer);
    } else {
      // Create new customer
      customer = this.customerRepository.create({
        ...dto,
        password: hashedPassword,
        hasPassword: true,
      });
      customer = await this.customerRepository.save(customer);
    }

    // Generate JWT token
    const token = await this.generateToken(customer);

    // Remove password from response
    const { password, ...customerData } = customer;

    return {
      customer: customerData,
      access_token: token,
    };
  }

  /**
   * Login customer with phone and password
   */
  async login(dto: CustomerLoginDto): Promise<{ customer: Partial<Customer>; access_token: string }> {
    // Find customer by phone
    const customer = await this.customerRepository.findOne({
      where: { phone: dto.phone },
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    if (!customer.hasPassword || !customer.password) {
      throw new UnauthorizedException('Please set a password first. Use the "Set Password" option.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, customer.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Generate JWT token
    const token = await this.generateToken(customer);

    // Remove password from response
    const { password, ...customerData } = customer;

    return {
      customer: customerData,
      access_token: token,
    };
  }

  /**
   * Set password for existing customer (who doesn't have one yet)
   */
  async setPassword(dto: SetPasswordDto): Promise<{ message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { phone: dto.phone },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found. Please register first.');
    }

    if (customer.hasPassword) {
      throw new BadRequestException('Password already set. Please use login or change password.');
    }

    // Hash and set password
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    customer.password = hashedPassword;
    customer.hasPassword = true;

    await this.customerRepository.save(customer);

    return {
      message: 'Password set successfully! You can now login.',
    };
  }

  /**
   * Get customer profile by ID
   */
  async getProfile(customerId: number): Promise<Partial<Customer>> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Remove password from response
    const { password, ...customerData } = customer;
    return customerData;
  }

  /**
   * Update customer profile
   */
  async updateProfile(customerId: number, dto: UpdateCustomerProfileDto): Promise<Partial<Customer>> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Update fields
    Object.assign(customer, dto);

    const updatedCustomer = await this.customerRepository.save(customer);

    // Remove password from response
    const { password, ...customerData } = updatedCustomer;
    return customerData;
  }

  /**
   * Change customer password
   */
  async changePassword(customerId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.password) {
      throw new BadRequestException('No password set. Please set a password first.');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, customer.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    customer.password = hashedPassword;

    await this.customerRepository.save(customer);

    return {
      message: 'Password changed successfully!',
    };
  }

  /**
   * Generate JWT token for customer
   */
  private async generateToken(customer: Customer): Promise<string> {
    const payload = {
      sub: customer.id,
      phone: customer.phone,
      name: customer.name,
      type: 'customer', // Differentiate from admin tokens
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: '30d', // Customer tokens last 30 days
      secret: Constants.JWT_SECRET,
    });
  }

  /**
   * Verify customer from JWT token
   */
  async verifyCustomer(customerId: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid token or customer not found');
    }

    return customer;
  }
}
