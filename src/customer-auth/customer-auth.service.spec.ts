import { BadRequestException } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { OtpPurpose } from './entities/phone-otp.entity';

/**
 * Guards the set-password flow. Before the one-time code existed, this endpoint
 * set a password for anyone who could name a phone number — and every guest
 * checkout creates an account with no password, so knowing a number was enough
 * to take the account over. These tests exist to keep that door shut.
 */
describe('CustomerAuthService set-password OTP', () => {
  let service: CustomerAuthService;
  let customerRepository: any;
  let otpRepository: any;
  let beemSmsService: { sendSms: jest.Mock };
  let otpRows: any[];
  let customer: any;

  const PHONE = '255712345678';

  /** Pulls the 6-digit code out of whatever we texted the customer. */
  const codeFromSms = (): string => {
    const message = beemSmsService.sendSms.mock.calls[0][1];
    const match = /\b(\d{6})\b/.exec(message);
    if (!match) throw new Error(`No code found in SMS: ${message}`);
    return match[1];
  };

  beforeEach(() => {
    otpRows = [];
    customer = {
      id: 3,
      phone: PHONE,
      businessId: 1,
      hasPassword: false,
      password: null,
    };

    customerRepository = {
      findOne: jest.fn(async ({ where }) =>
        where.phone === customer.phone ? customer : null,
      ),
      save: jest.fn(async (c) => c),
    };

    otpRepository = {
      create: jest.fn((row) => ({ attempts: 0, consumedAt: null, ...row })),
      save: jest.fn(async (row) => {
        if (!row.id) {
          row.id = otpRows.length + 1;
          otpRows.push(row);
        }
        return row;
      }),
      // Newest unconsumed code for the phone, mirroring order: { id: 'DESC' }.
      findOne: jest.fn(async ({ where }) =>
        [...otpRows]
          .reverse()
          .find(
            (r) =>
              r.phone === where.phone &&
              r.purpose === where.purpose &&
              r.consumedAt === null,
          ) ?? null,
      ),
      update: jest.fn(async (where, patch) => {
        otpRows
          .filter((r) => r.phone === where.phone && r.consumedAt === null)
          .forEach((r) => Object.assign(r, patch));
      }),
    };

    beemSmsService = { sendSms: jest.fn().mockResolvedValue(true) };

    service = new CustomerAuthService(
      customerRepository,
      otpRepository,
      { signAsync: jest.fn() } as any,
      beemSmsService as any,
      { getBusinessId: jest.fn().mockReturnValue(1) } as any,
    );
  });

  describe('requestSetPasswordOtp', () => {
    it('texts a 6-digit code to a customer who has no password yet', async () => {
      await service.requestSetPasswordOtp({ phone: PHONE });

      expect(beemSmsService.sendSms).toHaveBeenCalledTimes(1);
      expect(codeFromSms()).toMatch(/^\d{6}$/);
      // Stored hashed, never in the clear.
      expect(otpRows[0].codeHash).not.toContain(codeFromSms());
    });

    it('says the same thing and sends nothing for an unknown number', async () => {
      const known = await service.requestSetPasswordOtp({ phone: PHONE });
      beemSmsService.sendSms.mockClear();

      const unknown = await service.requestSetPasswordOtp({ phone: '255700000000' });

      // Identical wording: the endpoint must not reveal who has an account.
      expect(unknown.message).toBe(known.message);
      expect(beemSmsService.sendSms).not.toHaveBeenCalled();
    });

    it('sends nothing when the customer already has a password', async () => {
      customer.hasPassword = true;

      await service.requestSetPasswordOtp({ phone: PHONE });

      expect(beemSmsService.sendSms).not.toHaveBeenCalled();
    });

    it('retires an earlier code when a new one is requested', async () => {
      await service.requestSetPasswordOtp({ phone: PHONE });
      const firstCode = codeFromSms();

      await service.requestSetPasswordOtp({ phone: PHONE });

      await expect(
        service.setPassword({ phone: PHONE, password: 'newpass1', otp: firstCode }),
      ).rejects.toThrow(BadRequestException);
      expect(customer.hasPassword).toBe(false);
    });
  });

  describe('setPassword', () => {
    it('sets the password when the code is correct', async () => {
      await service.requestSetPasswordOtp({ phone: PHONE });

      const result = await service.setPassword({
        phone: PHONE,
        password: 'newpass1',
        otp: codeFromSms(),
      });

      expect(result.message).toContain('Password set successfully');
      expect(customer.hasPassword).toBe(true);
      expect(customer.password).not.toBe('newpass1'); // hashed, not stored raw
    });

    it('refuses when no code was ever requested', async () => {
      await expect(
        service.setPassword({ phone: PHONE, password: 'newpass1', otp: '123456' }),
      ).rejects.toThrow(BadRequestException);
      expect(customer.hasPassword).toBe(false);
    });

    it('refuses a wrong code and counts the attempt', async () => {
      await service.requestSetPasswordOtp({ phone: PHONE });
      const wrong = codeFromSms() === '000000' ? '111111' : '000000';

      await expect(
        service.setPassword({ phone: PHONE, password: 'newpass1', otp: wrong }),
      ).rejects.toThrow(BadRequestException);

      expect(otpRows[0].attempts).toBe(1);
      expect(customer.hasPassword).toBe(false);
    });

    it('refuses an expired code', async () => {
      await service.requestSetPasswordOtp({ phone: PHONE });
      otpRows[0].expiresAt = new Date(Date.now() - 1000);

      await expect(
        service.setPassword({ phone: PHONE, password: 'newpass1', otp: codeFromSms() }),
      ).rejects.toThrow(BadRequestException);
      expect(customer.hasPassword).toBe(false);
    });

    it('locks the code after too many wrong guesses, even if the right one follows', async () => {
      await service.requestSetPasswordOtp({ phone: PHONE });
      const right = codeFromSms();
      const wrong = right === '000000' ? '111111' : '000000';

      for (let i = 0; i < 5; i++) {
        await expect(
          service.setPassword({ phone: PHONE, password: 'newpass1', otp: wrong }),
        ).rejects.toThrow(BadRequestException);
      }

      await expect(
        service.setPassword({ phone: PHONE, password: 'newpass1', otp: right }),
      ).rejects.toThrow('Too many incorrect attempts');
      expect(customer.hasPassword).toBe(false);
    });

    it('will not accept the same code twice', async () => {
      await service.requestSetPasswordOtp({ phone: PHONE });
      const code = codeFromSms();

      await service.setPassword({ phone: PHONE, password: 'newpass1', otp: code });

      // Replaying the request must not work, even before hasPassword is consulted.
      await expect(
        service.setPassword({ phone: PHONE, password: 'attacker1', otp: code }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
