import { ForbiddenException, Injectable, Scope } from '@nestjs/common';

export interface UserContext {
  userId: number;
  username: string;
  businessId: number;
}

@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  private user: UserContext;

  setUser(user: UserContext) {
    this.user = user;
  }

  getUser(): UserContext {
    return this.user;
  }

  getBusinessId(): number {
    const businessId = this.user?.businessId;
    if (!businessId) {
      throw new ForbiddenException(
        'Business context not available. Please log out and log back in.',
      );
    }
    return businessId;
  }
}
