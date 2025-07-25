import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Constants } from '../utils/constants';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { UserContextService } from './user/dto/user.context';



@Injectable()
export  class AuthGuard implements CanActivate {

  constructor(private jwtService: JwtService, private readonly reflector: Reflector,
              private readonly userContextService: UserContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {


    const isPublic = this.reflector.get<boolean>("isPublic", context.getHandler());
    console.log(isPublic)

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret:  Constants.JWT_SECRET
        }
      );
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;

      // Here, we save the user info to the UserContextService
      const user = {
        userId: payload.sub,
        username: payload.username,  // Assuming `username` is in the token
      };

      // Save user to the UserContextService
      this.userContextService.setUser(user);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}