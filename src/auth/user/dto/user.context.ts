import { Injectable } from '@nestjs/common';

@Injectable()
export class UserContextService {
  private user: any;  // You can replace `any` with the appropriate type based on your payload

  // Set user data (called by JWT strategy)
  setUser(user: any) {
    this.user = user;
  }

  // Get user data
  getUser(): any {
    return this.user;
  }
}
