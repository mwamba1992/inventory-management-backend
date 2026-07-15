import { Injectable, Logger, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Customer } from '../settings/customer/entities/customer.entity';
import { PhoneOtp, OtpPurpose } from './entities/phone-otp.entity';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { BeemSmsService } from '../beem-sms/beem-sms.service';
import { Constants } from '../utils/constants';
import { UserContextService } from '../auth/user/dto/user.context';

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);

  private readonly OTP_TTL_MS = 10 * 60 * 1000;
  private readonly OTP_MAX_ATTEMPTS = 5;

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(PhoneOtp)
    private readonly otpRepository: Repository<PhoneOtp>,
    private readonly jwtService: JwtService,
    private readonly beemSmsService: BeemSmsService,
    private readonly userContextService: UserContextService,
  ) {}

  /**
   * Register a new customer with password
   */
  async register(dto: CustomerRegisterDto, businessId?: number): Promise<{ customer: Partial<Customer>; access_token: string }> {
    // Resolve businessId: parameter takes priority, then UserContextService
    const resolvedBusinessId = businessId || this.userContextService.getBusinessId();

    // Check if customer already exists (scoped by businessId)
    const whereClause: any = { phone: dto.phone };
    if (resolvedBusinessId) {
      whereClause.businessId = resolvedBusinessId;
    }

    const existingCustomer = await this.customerRepository.findOne({
      where: whereClause,
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
        ...(resolvedBusinessId && { businessId: resolvedBusinessId }),
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
  async login(dto: CustomerLoginDto, businessId?: number): Promise<{ customer: Partial<Customer>; access_token: string }> {
    // Resolve businessId: parameter takes priority, then UserContextService
    const resolvedBusinessId = businessId || this.userContextService.getBusinessId();

    // Find customer by phone (scoped by businessId)
    const whereClause: any = { phone: dto.phone };
    if (resolvedBusinessId) {
      whereClause.businessId = resolvedBusinessId;
    }

    const customer = await this.customerRepository.findOne({
      where: whereClause,
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
   * Locate a customer by the phone string as supplied, scoped to a business.
   * Phone is matched exactly, the same way login does — the storefront sends
   * back the number captured at checkout, so the formats line up.
   */
  private async findCustomerByPhone(
    phone: string,
    businessId?: number,
  ): Promise<Customer | null> {
    const whereClause: any = { phone };
    if (businessId) {
      whereClause.businessId = businessId;
    }
    return this.customerRepository.findOne({ where: whereClause });
  }

  /**
   * Send a one-time code to a phone number so its owner can claim the account
   * that guest checkout created for them.
   */
  async requestSetPasswordOtp(
    dto: RequestOtpDto,
    businessId?: number,
  ): Promise<{ message: string }> {
    const resolvedBusinessId = businessId || this.userContextService.getBusinessId();

    // Identical response whether or not the number is registered. Saying
    // "customer not found" would turn this endpoint into a free oracle for
    // testing which phone numbers have shopped here.
    const genericResponse = {
      message:
        'If that number has an account without a password, we have sent it a code.',
    };

    const customer = await this.findCustomerByPhone(dto.phone, resolvedBusinessId);

    if (!customer || customer.hasPassword) {
      this.logger.log(
        `Set-password code requested for ${dto.phone}: no eligible account, nothing sent`,
      );
      return genericResponse;
    }

    // Retire any outstanding codes so only the newest one works.
    await this.otpRepository.update(
      {
        phone: dto.phone,
        purpose: OtpPurpose.SET_PASSWORD,
        consumedAt: IsNull(),
      },
      { consumedAt: new Date() },
    );

    // randomInt, not Math.random: this is a credential.
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.otpRepository.save(
      this.otpRepository.create({
        phone: dto.phone,
        purpose: OtpPurpose.SET_PASSWORD,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + this.OTP_TTL_MS),
        businessId: resolvedBusinessId,
      }),
    );

    await this.beemSmsService.sendSms(
      dto.phone,
      `${code} is your Global Authentic TZ code. It expires in 10 minutes. Do not share it with anyone.`,
      'customer-auth:set-password-otp',
      undefined,
      resolvedBusinessId,
    );

    this.logger.log(`Set-password code sent to ${dto.phone}`);
    return genericResponse;
  }

  /**
   * Set the password for a customer who has proved, via a code sent to their
   * phone, that the number is theirs.
   */
  async setPassword(dto: SetPasswordDto, businessId?: number): Promise<{ message: string }> {
    const resolvedBusinessId = businessId || this.userContextService.getBusinessId();

    const otp = await this.otpRepository.findOne({
      where: {
        phone: dto.phone,
        purpose: OtpPurpose.SET_PASSWORD,
        consumedAt: IsNull(),
      },
      order: { id: 'DESC' },
    });

    // One message for missing, expired and wrong codes alike — distinguishing
    // them tells an attacker which numbers have a code in flight.
    const rejection = new BadRequestException(
      'That code is invalid or has expired. Please request a new one.',
    );

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw rejection;
    }

    if (otp.attempts >= this.OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many incorrect attempts. Please request a new code.',
      );
    }

    if (!(await bcrypt.compare(dto.otp, otp.codeHash))) {
      otp.attempts += 1;
      await this.otpRepository.save(otp);
      throw rejection;
    }

    // Burn the code before doing anything with it, so a replay of this exact
    // request cannot set the password a second time.
    otp.consumedAt = new Date();
    await this.otpRepository.save(otp);

    const customer = await this.findCustomerByPhone(dto.phone, resolvedBusinessId);

    if (!customer) {
      throw new NotFoundException('Customer not found. Please register first.');
    }

    if (customer.hasPassword) {
      throw new BadRequestException('Password already set. Please use login or change password.');
    }

    customer.password = await bcrypt.hash(dto.password, 10);
    customer.hasPassword = true;

    await this.customerRepository.save(customer);
    this.logger.log(`Password set for customer ${customer.id} after code verification`);

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
      type: 'customer',
      businessId: customer.businessId,
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
