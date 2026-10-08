import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Constants } from '../utils/constants';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private jwtService: JwtService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>("isPublic", context.getHandler());

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn(`No token found for ${request.method} ${request.url}`);
      throw new UnauthorizedException('No token provided');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: Constants.JWT_SECRET
        }
      );
    } catch (error) {
      this.logger.error(`JWT verification failed for ${request.url}: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Customer tokens are signed with the same secret as staff tokens, so a
    // valid signature alone does not make the caller staff. Storefront
    // customers reach their own routes through @Public() + CustomerAuthGuard,
    // never through here.
    if (payload.type === 'customer') {
      this.logger.warn(`Customer token refused on staff route ${request.method} ${request.url}`);
      throw new ForbiddenException('Staff access only');
    }

    request['user'] = payload;
    this.logger.log(`Auth OK: user=${payload.sub}, businessId=${payload.businessId}, url=${request.url}`);
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}