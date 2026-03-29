import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/roles';
import { MODULE_ACCESS_KEY } from '../decorators/module-access.decorator';
import { canRoleAccessTenantModule, TenantModuleId } from '../tenant-settings';
import { TenantService } from '../tenant.service';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleId = this.reflector.getAllAndOverride<TenantModuleId | undefined>(MODULE_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!moduleId) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { tenantId?: string; role?: Role } | undefined;
    if (!user?.tenantId || !user?.role) return false;

    const settings = await this.tenantService.getExperienceSettings(user.tenantId);
    if (!canRoleAccessTenantModule(settings, user.role, moduleId)) {
      throw new ForbiddenException(`Your role is not permitted to access the ${moduleId} module.`);
    }

    return true;
  }
}
