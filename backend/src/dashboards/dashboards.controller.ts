import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/roles';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('ict-manager')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  getIctManager(@TenantId() tenantId: string) {
    return this.dashboardsService.getIctManagerDashboard(tenantId);
  }

  @Get('executive')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.EXECUTIVE)
  getExecutive(@TenantId() tenantId: string) {
    return this.dashboardsService.getExecutiveDashboard(tenantId);
  }
}
