import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Rejects customer tokens on staff endpoints.
 *
 * The global AuthGuard accepts any token signed with the shared secret, and
 * customer tokens are signed with it too, so "has a valid token" does not on
 * its own mean "is staff".
 */
@Injectable()
export class StaffOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest()['user'];
    if (!user || user.type === 'customer') {
      throw new ForbiddenException('Staff access only');
    }
    return true;
  }
}
