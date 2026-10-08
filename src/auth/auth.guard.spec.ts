import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

const contextFor = (request: any) =>
  ({
    getHandler: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  }) as any;

const build = ({ isPublic = false, payload = undefined as any, verifyFails = false } = {}) => {
  const jwtService = {
    verifyAsync: verifyFails
      ? jest.fn().mockRejectedValue(new Error('jwt expired'))
      : jest.fn().mockResolvedValue(payload),
  };
  const reflector = { get: jest.fn().mockReturnValue(isPublic) };
  return new AuthGuard(jwtService as any, reflector as any);
};

const requestWith = (token?: string) => ({
  method: 'GET',
  url: '/items',
  headers: token ? { authorization: `Bearer ${token}` } : {},
});

describe('AuthGuard', () => {
  it('lets a staff token through and records who it is', async () => {
    const request = requestWith('staff');
    const guard = build({ payload: { sub: 1, username: 'admin', businessId: 1 } });

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request['user']).toMatchObject({ sub: 1, businessId: 1 });
  });

  it('refuses a customer token, even though its signature is valid', async () => {
    const request = requestWith('customer');
    const guard = build({ payload: { sub: 9, phone: '2557', type: 'customer', businessId: 1 } });

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(ForbiddenException);
    expect(request['user']).toBeUndefined();
  });

  it('refuses a request with no token', async () => {
    await expect(build().canActivate(contextFor(requestWith()))).rejects.toThrow(UnauthorizedException);
  });

  it('refuses an invalid or expired token', async () => {
    const guard = build({ verifyFails: true });
    await expect(guard.canActivate(contextFor(requestWith('bad')))).rejects.toThrow(UnauthorizedException);
  });

  it('leaves public routes alone', async () => {
    const guard = build({ isPublic: true });
    await expect(guard.canActivate(contextFor(requestWith()))).resolves.toBe(true);
  });
});
