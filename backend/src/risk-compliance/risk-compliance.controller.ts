import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/roles';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { AuditFinding, DisasterRecoveryPlan, RiskRegisterItem } from './entities';
import { RiskComplianceService } from './risk-compliance.service';
import { ModuleAccess } from '../tenant/decorators/module-access.decorator';
import { ModuleAccessGuard } from '../tenant/guards/module-access.guard';

@Controller('risk-compliance')
@ModuleAccess('risk-compliance')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
export class RiskComplianceController {
  constructor(private readonly service: RiskComplianceService) {}

  @Get('risks')
  listRisks(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('domain') domain?: string,
  ): Promise<RiskRegisterItem[]> {
    return this.service.listRisks(tenantId, status, domain);
  }

  @Get('risks/:id')
  getRisk(@TenantId() tenantId: string, @Param('id') id: string): Promise<RiskRegisterItem> {
    return this.service.getRisk(tenantId, id);
  }

  @Post('risks')
  @Roles(Role.ICT_MANAGER)
  createRisk(@TenantId() tenantId: string, @Body() body: Partial<RiskRegisterItem>): Promise<RiskRegisterItem> {
    return this.service.createRisk(tenantId, body);
  }

  @Put('risks/:id')
  @Roles(Role.ICT_MANAGER)
  updateRisk(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<RiskRegisterItem>,
  ): Promise<RiskRegisterItem> {
    return this.service.updateRisk(tenantId, id, body);
  }

  @Delete('risks/:id')
  @Roles(Role.ICT_MANAGER)
  deleteRisk(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteRisk(tenantId, id);
  }

  @Get('findings')
  listFindings(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ): Promise<AuditFinding[]> {
    return this.service.listFindings(tenantId, status, severity);
  }

  @Get('findings/:id')
  getFinding(@TenantId() tenantId: string, @Param('id') id: string): Promise<AuditFinding> {
    return this.service.getFinding(tenantId, id);
  }

  @Post('findings')
  @Roles(Role.ICT_MANAGER)
  createFinding(@TenantId() tenantId: string, @Body() body: Partial<AuditFinding>): Promise<AuditFinding> {
    return this.service.createFinding(tenantId, body);
  }

  @Put('findings/:id')
  @Roles(Role.ICT_MANAGER)
  updateFinding(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<AuditFinding>,
  ): Promise<AuditFinding> {
    return this.service.updateFinding(tenantId, id, body);
  }

  @Delete('findings/:id')
  @Roles(Role.ICT_MANAGER)
  deleteFinding(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteFinding(tenantId, id);
  }

  @Get('dr-plans')
  listDisasterRecoveryPlans(@TenantId() tenantId: string): Promise<DisasterRecoveryPlan[]> {
    return this.service.listDisasterRecoveryPlans(tenantId);
  }

  @Get('dr-plans/:id')
  getDisasterRecoveryPlan(@TenantId() tenantId: string, @Param('id') id: string): Promise<DisasterRecoveryPlan> {
    return this.service.getDisasterRecoveryPlan(tenantId, id);
  }

  @Post('dr-plans')
  @Roles(Role.ICT_MANAGER)
  createDisasterRecoveryPlan(
    @TenantId() tenantId: string,
    @Body() body: Partial<DisasterRecoveryPlan>,
  ): Promise<DisasterRecoveryPlan> {
    return this.service.createDisasterRecoveryPlan(tenantId, body);
  }

  @Put('dr-plans/:id')
  @Roles(Role.ICT_MANAGER)
  updateDisasterRecoveryPlan(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<DisasterRecoveryPlan>,
  ): Promise<DisasterRecoveryPlan> {
    return this.service.updateDisasterRecoveryPlan(tenantId, id, body);
  }

  @Delete('dr-plans/:id')
  @Roles(Role.ICT_MANAGER)
  deleteDisasterRecoveryPlan(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.service.deleteDisasterRecoveryPlan(tenantId, id);
  }

  @Get('dr-overview')
  getDisasterRecoveryOverview(@TenantId() tenantId: string) {
    return this.service.getDisasterRecoveryOverview(tenantId);
  }

  @Get('dashboard-stats')
  getDashboardStats(@TenantId() tenantId: string) {
    return this.service.getDashboardStats(tenantId);
  }
}
