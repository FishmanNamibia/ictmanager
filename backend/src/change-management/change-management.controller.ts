import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/roles';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { ChangeManagementService } from './change-management.service';
import { ChangeRequest, ReleaseRecord } from './entities';

@Controller('change-management')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChangeManagementController {
  constructor(private readonly service: ChangeManagementService) {}

  @Get('changes')
  listChanges(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('riskLevel') riskLevel?: string,
  ): Promise<ChangeRequest[]> {
    return this.service.listChanges(tenantId, status, riskLevel);
  }

  @Get('changes/:id')
  getChange(@TenantId() tenantId: string, @Param('id') id: string): Promise<ChangeRequest> {
    return this.service.getChange(tenantId, id);
  }

  @Post('changes')
  @Roles(Role.ICT_MANAGER, Role.ICT_STAFF)
  createChange(@TenantId() tenantId: string, @Body() body: Partial<ChangeRequest>): Promise<ChangeRequest> {
    return this.service.createChange(tenantId, body);
  }

  @Put('changes/:id')
  @Roles(Role.ICT_MANAGER)
  updateChange(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<ChangeRequest>,
  ): Promise<ChangeRequest> {
    return this.service.updateChange(tenantId, id, body);
  }

  @Delete('changes/:id')
  @Roles(Role.ICT_MANAGER)
  deleteChange(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteChange(tenantId, id);
  }

  @Get('releases')
  listReleases(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
  ): Promise<ReleaseRecord[]> {
    return this.service.listReleases(tenantId, status);
  }

  @Get('releases/:id')
  getRelease(@TenantId() tenantId: string, @Param('id') id: string): Promise<ReleaseRecord> {
    return this.service.getRelease(tenantId, id);
  }

  @Post('releases')
  @Roles(Role.ICT_MANAGER)
  createRelease(@TenantId() tenantId: string, @Body() body: Partial<ReleaseRecord>): Promise<ReleaseRecord> {
    return this.service.createRelease(tenantId, body);
  }

  @Put('releases/:id')
  @Roles(Role.ICT_MANAGER)
  updateRelease(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<ReleaseRecord>,
  ): Promise<ReleaseRecord> {
    return this.service.updateRelease(tenantId, id, body);
  }

  @Delete('releases/:id')
  @Roles(Role.ICT_MANAGER)
  deleteRelease(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteRelease(tenantId, id);
  }

  @Get('dashboard-stats')
  getDashboardStats(@TenantId() tenantId: string) {
    return this.service.getDashboardStats(tenantId);
  }
}

