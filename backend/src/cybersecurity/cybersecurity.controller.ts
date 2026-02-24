import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CybersecurityService } from './cybersecurity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/roles';
import { SecurityIncident, IncidentStatus, IncidentSeverity, IctRisk, RiskStatus, RiskLevel, Vulnerability, VulnerabilityStatus, AccessReview, AccessReviewStatus, SecurityAuditEvidence, AuditType } from './entities';

@Controller('cybersecurity')
@UseGuards(JwtAuthGuard)
export class CybersecurityController {
  constructor(private readonly service: CybersecurityService) {}

  // Security Incidents
  @Post('incidents')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.EXECUTIVE)
  createIncident(@TenantId() tenantId: string, @Body() body: Partial<SecurityIncident>) {
    return this.service.createIncident(tenantId, body);
  }

  @Get('incidents')
  findIncidents(@TenantId() tenantId: string, @Query('status') status?: IncidentStatus) {
    return this.service.findIncidents(tenantId, status);
  }

  @Get('incidents/:id')
  findIncident(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.findIncident(tenantId, id);
  }

  @Put('incidents/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.EXECUTIVE)
  updateIncident(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: Partial<SecurityIncident>) {
    return this.service.updateIncident(tenantId, id, body);
  }

  @Delete('incidents/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  deleteIncident(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.deleteIncident(tenantId, id);
  }

  // ICT Risks
  @Post('risks')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  createRisk(@TenantId() tenantId: string, @Body() body: Partial<IctRisk>) {
    return this.service.createRisk(tenantId, body);
  }

  @Get('risks')
  findRisks(@TenantId() tenantId: string, @Query('status') status?: RiskStatus) {
    return this.service.findRisks(tenantId, status);
  }

  @Get('risks/:id')
  findRisk(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.findRisk(tenantId, id);
  }

  @Put('risks/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  updateRisk(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: Partial<IctRisk>) {
    return this.service.updateRisk(tenantId, id, body);
  }

  @Delete('risks/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  deleteRisk(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.deleteRisk(tenantId, id);
  }

  // Vulnerabilities
  @Post('vulnerabilities')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  createVulnerability(@TenantId() tenantId: string, @Body() body: Partial<Vulnerability>) {
    return this.service.createVulnerability(tenantId, body);
  }

  @Get('vulnerabilities')
  findVulnerabilities(@TenantId() tenantId: string, @Query('status') status?: VulnerabilityStatus) {
    return this.service.findVulnerabilities(tenantId, status);
  }

  @Get('vulnerabilities/:id')
  findVulnerability(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.findVulnerability(tenantId, id);
  }

  @Put('vulnerabilities/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  updateVulnerability(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: Partial<Vulnerability>) {
    return this.service.updateVulnerability(tenantId, id, body);
  }

  @Delete('vulnerabilities/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  deleteVulnerability(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.deleteVulnerability(tenantId, id);
  }

  // Access Reviews
  @Post('access-reviews')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  createAccessReview(@TenantId() tenantId: string, @Body() body: Partial<AccessReview>) {
    return this.service.createAccessReview(tenantId, body);
  }

  @Get('access-reviews')
  findAccessReviews(@TenantId() tenantId: string, @Query('status') status?: AccessReviewStatus) {
    return this.service.findAccessReviews(tenantId, status);
  }

  @Get('access-reviews/:id')
  findAccessReview(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.findAccessReview(tenantId, id);
  }

  @Put('access-reviews/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  updateAccessReview(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: Partial<AccessReview>) {
    return this.service.updateAccessReview(tenantId, id, body);
  }

  @Delete('access-reviews/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER)
  deleteAccessReview(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.deleteAccessReview(tenantId, id);
  }

  // Audit Evidence
  @Post('audit-evidence')
  @UseGuards(RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.EXECUTIVE)
  logAuditEvidence(@TenantId() tenantId: string, @Body() body: Partial<SecurityAuditEvidence>) {
    return this.service.logAuditEvidence(tenantId, body);
  }

  @Get('audit-evidence')
  findAuditEvidence(
    @TenantId() tenantId: string,
    @Query('auditType') auditType?: AuditType,
    @Query('userId') userId?: string,
    @Query('days') days?: number,
  ) {
    return this.service.findAuditEvidence(tenantId, { auditType, userId, days });
  }

  // Dashboard
  @Get('dashboard/stats')
  getSecurityDashboardStats(@TenantId() tenantId: string) {
    return this.service.getSecurityDashboardStats(tenantId);
  }
}
