import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  /** Any authenticated user can access the ICT Manager dashboard (My Desk). */
  @Get('ict-manager')
  getIctManager(@TenantId() tenantId: string) {
    return this.dashboardsService.getIctManagerDashboard(tenantId);
  }

  /** Any authenticated user can access the executive dashboard. */
  @Get('executive')
  getExecutive(@TenantId() tenantId: string) {
    return this.dashboardsService.getExecutiveDashboard(tenantId);
  }
}
