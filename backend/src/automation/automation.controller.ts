import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/roles';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { AutomationService } from './automation.service';

@Controller('automation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('status')
  @Roles(Role.ICT_MANAGER, Role.EXECUTIVE, Role.AUDITOR)
  getStatus(@TenantId() tenantId: string) {
    return this.automationService.getStatus(tenantId);
  }

  @Post('run')
  @Roles(Role.ICT_MANAGER)
  runNow(@TenantId() tenantId: string) {
    return this.automationService.runNow(tenantId);
  }
}
