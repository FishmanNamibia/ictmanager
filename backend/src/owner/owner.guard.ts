import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { AuthenticatedRequestUser } from '../auth/auth.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedRequestUser }>();
    if (request.user?.role !== 'owner') {
      throw new ForbiddenException('Owner access required');
    }
    return true;
  }
}
