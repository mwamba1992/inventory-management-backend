import { Injectable, Scope } from '@nestjs/common';

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
    return this.user?.businessId;
  }
}
