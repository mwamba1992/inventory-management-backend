import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

export interface UserContext {
  userId: number;
  username: string;
  businessId: number;
}

@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getUser(): UserContext | undefined {
    const payload = this.request['user'];
    if (!payload) {
      return undefined;
    }
    return {
      userId: payload.sub,
      username: payload.username,
      businessId: payload.businessId,
    };
  }

  getBusinessId(): number {
    const payload = this.request['user'];
    if (payload?.businessId) {
      return payload.businessId;
    }

    const headerBusinessId = this.request.headers['x-business-id'];
    if (headerBusinessId) {
      return Number(headerBusinessId);
    }

    const defaultBusinessId = process.env.DEFAULT_BUSINESS_ID;
    if (defaultBusinessId) {
      return Number(defaultBusinessId);
    }

    throw new ForbiddenException(
      'Business context not available. Please log out and log back in.',
    );
  }
}
