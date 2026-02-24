import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/decorators/tenant-id.decorator';
import { Policy, PolicyStatus } from './policy.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/roles';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  create(@TenantId() tenantId: string, @Body() body: CreatePolicyDto, @CurrentUser() actor: any) {
    return this.policiesService.create(tenantId, body, { userId: actor?.id ?? null, name: actor?.email ?? null });
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  createCategory(@TenantId() tenantId: string, @Body() body: Partial<any>) {
    return this.policiesService.createCategory(tenantId, body);
  }

  @Get('categories')
  listCategories(@TenantId() tenantId: string) {
    return this.policiesService.listCategories(tenantId);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: PolicyStatus,
    @Query('categoryId') categoryId?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('documentType') documentType?: string,
    @Query('search') search?: string,
    @Query('overdue') overdue?: string,
  ) {
    return this.policiesService.findAll(tenantId, status, {
      categoryId,
      riskLevel,
      documentType,
      search,
      overdue: overdue === 'true',
    });
  }

  @Get('governance-stats')
  getGovernanceStats(@TenantId() tenantId: string) {
    return this.policiesService.getGovernanceStats(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.findOne(tenantId, id);
  }

  @Get(':id/workflow')
  workflow(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.getWorkflowHistory(tenantId, id);
  }

  @Get(':id/versions')
  versions(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.listVersions(tenantId, id);
  }

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  addVersion(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { versionLabel: string; documentUrl?: string; changeSummary?: string; uploadedBy?: string; isCurrent?: boolean },
    @CurrentUser() actor: any,
  ) {
    return this.policiesService.addVersion(tenantId, id, body, { userId: actor?.id ?? null, name: actor?.email ?? null });
  }

  @Post(':id/versions/:versionId/set-current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  setCurrentVersion(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() actor: any,
  ) {
    return this.policiesService.setCurrentVersion(tenantId, id, versionId, { userId: actor?.id ?? null, name: actor?.email ?? null });
  }

  @Get(':id/ack-scope')
  ackScope(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.getAcknowledgementScope(tenantId, id);
  }

  @Put(':id/ack-scope')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  setAckScope(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('scopes') scopes: Array<{ role?: string; department?: string }>,
    @CurrentUser() actor: any,
  ) {
    return this.policiesService.setAcknowledgementScope(tenantId, id, scopes ?? [], { userId: actor?.id ?? null, name: actor?.email ?? null });
  }

  @Post(':id/link-application')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  linkApplication(@TenantId() tenantId: string, @Param('id') id: string, @Body('applicationId') applicationId: string) {
    return this.policiesService.linkApplication(tenantId, id, applicationId);
  }

  @Post(':id/unlink-application')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  unlinkApplication(@TenantId() tenantId: string, @Param('id') id: string, @Body('applicationId') applicationId: string) {
    return this.policiesService.unlinkApplication(tenantId, id, applicationId);
  }

  @Post(':id/link-asset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  linkAsset(@TenantId() tenantId: string, @Param('id') id: string, @Body('assetId') assetId: string) {
    return this.policiesService.linkAsset(tenantId, id, assetId);
  }

  @Post(':id/unlink-asset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  unlinkAsset(@TenantId() tenantId: string, @Param('id') id: string, @Body('assetId') assetId: string) {
    return this.policiesService.unlinkAsset(tenantId, id, assetId);
  }

  @Post(':id/link-license')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  linkLicense(@TenantId() tenantId: string, @Param('id') id: string, @Body('licenseId') licenseId: string) {
    return this.policiesService.linkLicense(tenantId, id, licenseId);
  }

  @Post(':id/unlink-license')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  unlinkLicense(@TenantId() tenantId: string, @Param('id') id: string, @Body('licenseId') licenseId: string) {
    return this.policiesService.unlinkLicense(tenantId, id, licenseId);
  }

  @Get(':id/links')
  links(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.getLinkedEntities(tenantId, id);
  }

  @Get(':id/evidence')
  evidence(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.exportEvidence(tenantId, id);
  }

  @Post(':id/acknowledge')
  acknowledge(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor?: any,
    @Body('userId') userId?: string,
    @Body('ip') ip?: string,
    @Body('userAgent') userAgent?: string,
  ) {
    return this.policiesService.acknowledge(tenantId, id, actor?.id ?? userId ?? '', ip, userAgent);
  }

  @Get(':id/acknowledgements')
  acknowledgements(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.getAcknowledgements(tenantId, id);
  }

  @Get('compliance/stats')
  complianceStats(@TenantId() tenantId: string) {
    return this.policiesService.getComplianceStats(tenantId);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.EXECUTIVE)
  approve(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('approver') approver: string,
    @Body('effectiveDate') effectiveDate?: string,
    @CurrentUser() actor?: any,
  ) {
    const eff = effectiveDate ? new Date(effectiveDate) : undefined;
    return this.policiesService.approvePolicy(
      tenantId,
      id,
      approver || actor?.email || 'Approver',
      eff,
      { userId: actor?.id ?? null, name: actor?.email ?? null },
    );
  }

  @Post(':id/retire')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER, Role.EXECUTIVE)
  retire(@TenantId() tenantId: string, @Param('id') id: string, @CurrentUser() actor?: any) {
    return this.policiesService.retirePolicy(tenantId, id, { userId: actor?.id ?? null, name: actor?.email ?? null });
  }

  @Post(':id/send-for-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  sendForReview(@TenantId() tenantId: string, @Param('id') id: string, @CurrentUser() actor?: any) {
    return this.policiesService.sendForReview(tenantId, id, { userId: actor?.id ?? null, name: actor?.email ?? null });
  }

  @Get('due-in/:days')
  dueIn(@TenantId() tenantId: string, @Param('days') days: number) {
    return this.policiesService.getDueInDays(tenantId, Number(days));
  }

  @Get(':id/unacknowledged')
  unacknowledged(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.getUnacknowledgedUsers(tenantId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdatePolicyDto,
    @CurrentUser() actor?: any,
  ) {
    return this.policiesService.update(tenantId, id, body, { userId: actor?.id ?? null, name: actor?.email ?? null });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ICT_MANAGER)
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.policiesService.remove(tenantId, id);
  }
}
